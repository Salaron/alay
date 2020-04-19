import { Redis } from "../core/database/redis"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import { costType, secretboxType, ErrorSecretboxNotAvailable } from "../models/secretbox"
import {
  ISecretboxAnimationAssets,
  ISecretboxButton,
  ISecretboxInfo,
  ISecretboxM,
  ISecretboxPage,
  IStepAdditionalInfo,
  ISecretboxCost,
  ISecretboxUnitInfo
} from "../typings/secretbox"
import { Utils } from "./utils"
import { ErrorAPI } from "../models/error"

const unitDB = sqlite3.getUnitDB()
const secretboxSVDB = sqlite3.getSecretboxSVDB()

export class Secretbox extends CommonModule {
  private useCache = Config.server.debug_mode
  private userItems: any
  constructor(action: BaseAction) {
    super(action)
  }

  public async getSecretboxPageList(memberCategory: memberCategory): Promise<{ member_category: number, page_list: ISecretboxPage[] }> {
    const secretboxList = await secretboxSVDB.all(`
    SELECT * FROM secret_box_m as box
    JOIN secret_box_page_m as page ON box.secret_box_id = page.secret_box_id
    WHERE start_date <= :date AND end_date > :date AND (member_category = :ctg OR member_category = 0)
    ORDER BY page.page_order DESC`, {
      date: Utils.toSpecificTimezone(9),
      ctg: memberCategory
    })

    const pageList = <ISecretboxPage[]>(await Promise.all(secretboxList.map(async (secretbox) => {
      try {
        return await this.getSecretboxPage(secretbox)
      } catch (err) {
        if (err instanceof ErrorSecretboxNotAvailable) {
          return false
        }
        throw err
      }
    }))).filter(secretbox => !!secretbox)

    return {
      member_category: memberCategory,
      page_list: pageList
    }
  }

  public async makePon(secretboxId: number, costId: number) {
    const secretboxM = await secretboxSVDB.get("SELECT * FROM secret_box_m WHERE secret_box_id = :secretboxId", { secretboxId })
    if (!secretboxM) throw new ErrorSecretboxNotAvailable(1500)
    const [beforeUserInfo, secretboxPage, user] = await Promise.all([
      this.action.user.getUserInfo(this.userId),
      this.getSecretboxPage(secretboxM),
      this.connection.first("SELECT box_gauge FROM users WHERE user_id = :user", { user: this.userId }),
      this.connection.query("INSERT INTO secretbox_pon (user_id, secretbox_id, pon_count) VALUES (:user, :sbId, 0) ON DUPLICATE KEY UPDATE pon_count = pon_count + 0", {
        user: this.userId,
        sbId: secretboxId
      })
    ])

    // find selected cost
    let currentButton: ISecretboxButton | null = null
    let currentCost: ISecretboxCost | null = null
    for (const button of secretboxPage.button_list) {
      if (currentCost) break
      for (const cost of button.cost_list) {
        if (cost.id === costId) {
          currentCost = cost
          currentButton = button
          break
        }
      }
    }
    if (!currentCost || !currentButton)
      throw new ErrorSecretboxNotAvailable(1500)
    if (currentCost.payable === false)
      throw new ErrorAPI(1507, "ERROR_CODE_SECRET_BOX_REMAINING_COST_IS_NOT_ENOUGH")
    if (secretboxPage.secret_box_info.pon_upper_limit > secretboxPage.secret_box_info.pon_count + currentCost.unit_count)
      throw new ErrorAPI(1509, "ERROR_CODE_SECRET_BOX_UPPER_LIMIT")

    if (currentCost.type !== costType.NON_COST) {
      await this.action.item.addItemToUser(this.userId, {
        type: currentCost.type,
        id: currentCost.item_id
      }, parseInt(`-${currentCost.amount}`))
    }

    let secretboxUnitInfoJSON = await Redis.get(`Secretbox:UnitInfo:${secretboxId}`)
    if (!secretboxUnitInfoJSON) {
      secretboxUnitInfoJSON = await Redis.get(`Secretbox:UnitInfo:${secretboxId}:Button:${currentButton.secret_box_button_type}`)
    }
    let secretboxUnitInfo: ISecretboxUnitInfo
    if (secretboxUnitInfoJSON && this.useCache) {
      secretboxUnitInfo = JSON.parse(secretboxUnitInfoJSON)
    } else {
      secretboxUnitInfo = await this.getSecretboxUnitInfo(secretboxId, currentButton.secret_box_button_type)
    }

    function getRandomUnit(groupId?: number) {
      if (!groupId) {
        let unitGroupIds: number[] = []
        for (const unitGroup of secretboxUnitInfo.unitGroup) {
          unitGroupIds.push(...new Array(unitGroup.weight).fill(unitGroup.id).flat())
        }
        groupId = unitGroupIds.randomValue()
      }

      let selectedUnitGroup: any
      for (const unitGroup of secretboxUnitInfo.unitGroup) {
        if (unitGroup.id === groupId) {
          selectedUnitGroup = unitGroup
        }
      }

      return {
        unitId: selectedUnitGroup!.unitIds.randomValue(),
        groupId
      }
    }

    let gainedUnit = []
    while (gainedUnit.length !== currentCost.unit_count) {
      gainedUnit.push(getRandomUnit())
    }

    if (currentCost.unit_count > 1) {
      let currentRarityMap: { [unitGroupId: number]: number } = {}
      for (const unitGroupId of gainedUnit) {
        if (!currentRarityMap[unitGroupId.groupId]) currentRarityMap[unitGroupId.groupId] = 0
        currentRarityMap[unitGroupId.groupId] += 1
      }

      for (const unitGroupIdString of Object.keys(secretboxUnitInfo.fixRarity)) {
        const unitGroupId = parseInt(unitGroupIdString)
        if (!currentRarityMap[unitGroupId]) currentRarityMap[unitGroupId] = 0
        let attempts = 0
        while (currentRarityMap[unitGroupId] < secretboxUnitInfo.fixRarity[unitGroupId]) {
          const oldUnit = gainedUnit.randomValue()
          if (oldUnit.groupId >= unitGroupId) {
            attempts += 1
            if (attempts > 3) break
            continue
          }
          const index = gainedUnit.map(unit => unit.unitId).indexOf(oldUnit.unitId)
          const newUnit = getRandomUnit(unitGroupId)
          currentRarityMap[oldUnit.groupId] -= 1
          currentRarityMap[newUnit.groupId] += 1
          gainedUnit[index] = newUnit
        }
      }
    }

    // prepare result of unit
    const unitResult = await Promise.all(gainedUnit.map(async unit => {
      const unitData: any = await this.action.unit.addUnit(this.userId, unit.unitId)
      unitData.is_hit = unitData.unit_rarity_id === 4
      unitData.is_signed = false
      return unitData
    }))

    // prepare result of item
    const gaugeReward = await secretboxSVDB.all("SELECT * FROM secret_box_gauge_reward_m")
    const addedGaugePoint = secretboxM.add_gauge * currentCost.unit_count
    const totalGaugePoint = user.box_gauge + addedGaugePoint
    let gainedItem = []
    if (totalGaugePoint >= 100) {
      gainedItem = gaugeReward
    }
    const itemResult = await Promise.all(gainedItem.map(async item => {
      item.reward_box_flag = false
      item.amount = Math.floor(totalGaugePoint / 100) * item.amount
      await this.action.item.addItemToUser(this.userId, {
        type: item.add_type,
      id: item.item_id
      }, item.amount)
      return item
    }))

    await Redis.del(`Secretbox:Page:${secretboxId}:${this.userId}`)
    const [afterSecretboxPage, afterUserInfo, supportUnits, userItems] = await Promise.all([
      this.getSecretboxPage(secretboxM),
      this.action.user.getUserInfo(this.userId),
      this.action.user.getSupportUnits(this.userId),
      this.connection.first("SELECT sns_coin, bt_tickets, green_tickets FROM users WHERE user_id = :userId", {
        userId: this.userId
      }),
      this.connection.execute("UPDATE secretbox_pon SET pon_count = pon_count + :count WHERE user_id = :userId AND secretbox_id = :secretboxId", {
        userId: this.userId,
        secretboxId,
        count: currentCost.unit_count
      }),
      this.connection.execute("UPDATE users SET box_gauge = :gauge WHERE user_id = :userId", {
        gauge: totalGaugePoint % 100,
        userId: this.userId
      })
    ])

    return {
      is_unit_max: false,
      item_list: [
        {
          item_id: 1,
          amount: userItems.green_tickets
        },
        {
          item_id: 5,
          amount: userItems.bt_tickets
        }
      ],
      gauge_info: {
        max_gauge_point: 100,
        gauge_point: totalGaugePoint,
        added_gauge_point: addedGaugePoint
      },
      button_list: afterSecretboxPage.button_list,
      secret_box_info: afterSecretboxPage.secret_box_info,
      secret_box_items: {
        unit: unitResult,
        item: itemResult
      },
      before_user_info: beforeUserInfo,
      after_user_info: afterUserInfo,
      free_muse_gacha_flag: false,
      free_aqours_gacha_flag: false,
      lowest_rarity: 4,
      promotion_performance_rate: 25, // flip rate
      secret_box_parcel_type: 2,
      limit_bonus_info: [],
      limit_bonus_rewards: [],
      unit_support_list: supportUnits
    }
  }

  public async getSecretboxUnitInfo(secretboxId: number, buttonType?: number): Promise<ISecretboxUnitInfo> {
    let unitInfoByButton = false
    const unitInfo: ISecretboxUnitInfo = {
      fixRarity: {},
      unitGroup: []
    }
    const fixRarityList = await secretboxSVDB.all("SELECT * FROM secret_box_fix_rarity_m WHERE secret_box_id = :secretboxId", { secretboxId })
    fixRarityList.map(fixRarity => {
      unitInfo.fixRarity[fixRarity.unit_group_id] = fixRarity.fix_rarity_count
    })

    let unitGroupList = await secretboxSVDB.all("SELECT * FROM secret_box_unit_group_m WHERE secret_box_id = :secretboxId", { secretboxId })
    if (unitGroupList.length === 0) {
      unitGroupList = await secretboxSVDB.all("SELECT * FROM secret_box_button_type_unit_group_m WHERE secret_box_id = :secretboxId AND secret_box_button_type = :buttonType", {
        secretboxId,
        buttonType
      })
      if (unitGroupList.length === 0) throw new Error("Unit group info is missing")
      unitInfoByButton = true
    }

    unitInfo.unitGroup = await Promise.all(unitGroupList.map(async unitGroup => {
      const unitFamilyList = await secretboxSVDB.all("SELECT * FROM secret_box_unit_family_m WHERE secret_box_id = :secretboxId AND unit_group_id = :rarity", {
        secretboxId,
        rarity: unitGroup.unit_group_id
      })

      let unitLineUp: number[] = []
      let unitIds: number[] = []
      for (const unitFamily of unitFamilyList) {
        const familyUnitIds = (await unitDB.all(`SELECT unit_id FROM unit_m WHERE ${unitFamily.query} ORDER BY unit_id DESC`)).map(unit => unit.unit_id)
        unitIds.push(...new Array(unitFamily.weight).fill(familyUnitIds).flat())
        unitLineUp.push(...familyUnitIds)
      }
      // TODO: limited rate support
      return {
        id: unitGroup.unit_group_id,
        weight: unitGroup.weight,
        unitIds,
        unitLineUp
      }
    }))
    let redisKey = `Secretbox:UnitInfo:${secretboxId}`
    if (unitInfoByButton)
      redisKey += `:Button:${buttonType}`
    await Redis.set(redisKey, JSON.stringify(unitInfo), "ex", 86000)
    return unitInfo
  }

  public async getSecretboxPage(secretboxId: number): Promise<ISecretboxPage>
  public async getSecretboxPage(secretboxM: number): Promise<ISecretboxPage>
  public async getSecretboxPage(input: ISecretboxM | number): Promise<ISecretboxPage> {
    let secretboxM: ISecretboxM
    if (typeof input === "number") {
      secretboxM = await secretboxSVDB.get("SELECT * FROM secret_box_m WHERE secret_box_id = :id", { id: input })
    } else {
      secretboxM = input
    }
    const currentDate = Utils.toSpecificTimezone(9)
    if (
      secretboxM.start_date > currentDate ||
      secretboxM.end_date <= currentDate
    ) throw new ErrorSecretboxNotAvailable(1508)

    let secretboxPage: ISecretboxPage
    const cachedData = await Redis.get(`Secretbox:Page:${secretboxM.secret_box_id}:${this.userId}`)
    if (cachedData && this.useCache) {
      // use cached data
      secretboxPage = JSON.parse(cachedData)
    } else {
      const [animationAssets, secretboxInfo, buttonList] = await Promise.all([
        this.getAnimationAssets(secretboxM.secret_box_id, secretboxM.secret_box_type),
        this.getSecretboxInfo(secretboxM.secret_box_id, secretboxM.secret_box_type),
        this.getButtons(secretboxM.secret_box_id, secretboxM.secret_box_type)
      ])

      secretboxPage = {
        menu_asset: animationAssets.menu_asset,
        menu_se_asset: animationAssets.menu_se_asset,
        animation_assets: animationAssets,
        button_list: buttonList,
        secret_box_info: secretboxInfo
      }
      await Redis.set(`Secretbox:Page:${secretboxM.secret_box_id}:${this.userId}`, JSON.stringify(secretboxPage), "ex", 86400)
    }

    return secretboxPage
  }

  private async getAdditionalInfo(id: number, type: number): Promise<undefined | IStepAdditionalInfo> {
    switch (type) {
      case secretboxType.STEP_UP: {
        // seems like klab removed step boxes...
        // for now it will be incomplete until it shows on official
        const [userPonCount, stepBase] = await Promise.all([
          this.getUserPonCount(id),
          secretboxSVDB.get("SELECT * FROM secret_box_step_up_base_m WHERE secret_box_id = :id", { id })
        ])
        if (!stepBase) throw new Error(`Step base data for secretbox #${id} is missing`)

        const currentStep = userPonCount + 1 % stepBase.number_of_steps
        const stepItemBonus = await secretboxSVDB.all("SELECT add_type, item_id, amount FROM secret_box_step_up_bonus_item_m WHERE secret_box_id = :id AND step = :currentStep", {
          id,
          currentStep
        })
        return <IStepAdditionalInfo>{
          secret_box_type: secretboxType.STEP_UP,
          step: 1,
          show_step: 1,
          end_step: stepBase.default_end_step,
          term_count: 0,
          step_up_bonus_bonus_item_list: stepItemBonus
        }
      }
      default: return undefined
    }
  }

  private async getSecretboxInfo(id: number, type: number): Promise<ISecretboxInfo> {
    const [secretbox, userPonCount, additionalInfo] = await Promise.all([
      secretboxSVDB.get("SELECT * FROM secret_box_m WHERE secret_box_id = :id", { id }),
      this.getUserPonCount(id),
      this.getAdditionalInfo(id, type)
    ])
    if (!secretbox) throw new Error("No data for secretbox id #" + id)
    const secretboxInfo: ISecretboxInfo = {
      secret_box_id: secretbox.secret_box_id,
      secret_box_type: secretbox.secret_box_type,
      name: secretbox.name,
      description: secretbox.description,
      start_date: secretbox.start_date,
      end_date: secretbox.end_date,
      show_end_date: secretbox.show_end_date_flag ? secretbox.end_date : undefined,
      add_gauge: secretbox.add_gauge,
      pon_count: userPonCount,
      pon_upper_limit: secretbox.upper_limit,
      additional_info: additionalInfo
    }

    return secretboxInfo
  }

  private async getButtons(id: number, type: number): Promise<ISecretboxButton[]> {
    await this.updateUserItems() // TODO: move it to some other place
    const buttonList = await secretboxSVDB.all("SELECT * FROM secret_box_button_m WHERE secret_box_id = :id", { id })
    const secretboxM: ISecretboxM = await secretboxSVDB.get("SELECT always_display_flag from secret_box_m WHERE secret_box_id = :id", { id })
    const alwaysDisplayFlag = !!secretboxM.always_display_flag
    let isPayable = false

    const buttons = await Promise.all(buttonList.map(async button => {
      let costList: any
      if (type === secretboxType.STEP_UP) {
        const stepInfo = await this.getAdditionalInfo(id, type)
        const stepSetting = await secretboxSVDB.get("SELECT balloon_asset FROM secret_box_step_up_step_setting_m WHERE secret_box_id = :id AND step = :step", {
          id,
          step: stepInfo?.show_step
        })
        if (stepSetting) {
          button.balloon_asset = stepSetting.balloon_asset
        }

        costList = await secretboxSVDB.all("SELECT * FROM secret_box_step_up_cost_m WHERE secret_box_id = :id AND secret_box_button_type = :buttonType AND step = :step", {
          id,
          buttonType: button.secret_box_button_type,
          step: stepInfo?.show_step
        })
      } else {
        costList = await secretboxSVDB.all("SELECT * FROM secret_box_cost_m WHERE secret_box_id = :id AND secret_box_button_type = :buttonType ORDER BY cost_order ASC", {
          id,
          buttonType: button.secret_box_button_type
        })
      }

      // process cost
      for (let i = costList.length - 1; i >= 0; i--) {
        let cost = costList[i]
        const payable = this.isCostPayable(cost.cost_type, cost.item_id, cost.amount)
        if (cost.hide_flag && !payable) {
          // make ticket cost not visible
          costList.splice(i, 1)
          continue
        }
        if (payable === true) isPayable = true
        costList[i] = {
          id: cost.secret_box_cost_id,
          payable,
          unit_count: cost.unit_count,
          type: cost.cost_type,
          item_id: cost.item_id,
          amount: cost.amount
        }
      }
      return {
        secret_box_button_type: button.secret_box_button_type,
        secret_box_name: button.secret_box_name,
        balloon_asset: button.balloon_asset !== null ? button.balloon_asset : undefined,
        cost_list: costList
      }
    }))
    if (alwaysDisplayFlag === false && isPayable === false)
      throw new ErrorSecretboxNotAvailable(0)

    return buttons
  }

  private async getAnimationAssets(id: number, type: secretboxType): Promise<ISecretboxAnimationAssets> {
    let animationAssetsData
    switch (type) {
      case secretboxType.DEFAULT:
      case secretboxType.STUB:
      case secretboxType.STEP_UP: {
        const secretboxPage = await secretboxSVDB.get("SELECT secret_box_animation_asset_id FROM secret_box_page_m WHERE secret_box_id = :id", {
          id
        })
        animationAssetsData = await secretboxSVDB.get("SELECT * FROM secret_box_animation_asset_m WHERE secret_box_animation_asset_id = :animId", {
          animId: secretboxPage.secret_box_animation_asset_id
        })
        break
      }
      default: throw new Error(`Secretbox type "${type}" is not supported`)
    }

    return <ISecretboxAnimationAssets>{
      type: animationAssetsData.secret_box_animation_type,
      background_asset: animationAssetsData.background_asset,
      additional_asset_1: animationAssetsData.additional_asset_1,
      additional_asset_2: animationAssetsData.additional_asset_2,
      additional_asset_3: animationAssetsData.additional_asset_3,
      menu_asset: animationAssetsData.menu_asset,
      menu_se_asset: animationAssetsData.menu_se_asset
    }
  }

  private async getUserPonCount(secretboxId: number): Promise<number> {
    let pon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
      user: this.userId,
      id: secretboxId
    })
    if (!pon) pon = { pon_count: 0 }
    return pon.pon_count
  }

  private isCostPayable(itemType: number, itemId: number | null, amount: number): boolean {
    if (!this.userItems) throw new Error("You need to update user items first")
    switch (itemType) {
      case costType.NON_COST: {
        return true
      }
      case costType.ITEM_TICKET: {
        if (itemId === 1) {
          return this.userItems.green_tickets >= amount
        }
        if (itemId === 5) {
          return this.userItems.bt_tickets >= amount
        }
        if (itemId === 8) {
          return Math.floor(this.userItems.green_tickets / 10) >= amount // green tickets <--> 10+1 ticket [1 : 10]
        }
        // TODO: other tickets
      }
      case costType.GAME_COIN: {
        return this.userItems.game_coin >= amount
      }
      case costType.LOVECA: {
        return this.userItems.sns_coin >= amount
      }
      case costType.FRIEND: {
        return this.userItems.social_point >= amount
      }
    }

    return false
  }

  private async updateUserItems() {
    this.userItems = await this.connection.first("SELECT sns_coin, bt_tickets, green_tickets, social_point, game_coin FROM users WHERE user_id = :user", {
      user: this.userId
    })
    // TODO: other tickets
  }
}
