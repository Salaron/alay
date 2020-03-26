import { Redis } from "../core/database/redis"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import { costType, secretboxType, ErrorSecretboxNotAvailable } from "../models/secretbox"
import { ISecretboxAnimationAssets, ISecretboxButton, ISecretboxInfo, ISecretboxM, ISecretboxPage, IStepAdditionalInfo, ISecretboxCost } from "../typings/secretbox"
import { Utils } from "./utils"

const unitDB = sqlite3.getUnitDB()
const secretboxSVDB = sqlite3.getSecretboxSVDB()

export class Secretbox extends CommonModule {
  private useCache = false
  private userItems: any
  constructor(action: BaseAction) {
    super(action)
  }

  public async getSecretboxPageList(memberCategory: memberCategory): Promise<{ member_category: number, page_list: ISecretboxPage[] }> {
    const secretboxList = await secretboxSVDB.all(`
    SELECT * FROM secret_box_m as box
    JOIN secret_box_page_m as page ON box.secret_box_id = page.secret_box_id
    WHERE start_date <= :date AND end_date > :date AND member_category = :ctg`, {
      date: Utils.toSpecificTimezone(9),
      ctg: memberCategory
    })

    const pageList = <ISecretboxPage[]>(await Promise.all(secretboxList.map(async (secretbox) => {
      const available = await this.isSecretboxAvailable(secretbox)
      if (!available) return false
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

  /**
   * Compile secretbox page by id
   * @returns `ISecretbox`
   * @returns `false` if this secretbox is not available
   */
  private async getSecretboxPage(secretBoxM: ISecretboxM): Promise<ISecretboxPage> {
    let secretboxPage: ISecretboxPage

    const cachedData = await Redis.get(`Secretbox:Page:${secretBoxM.secret_box_id}:${this.userId}`)
    if (cachedData && this.useCache) {
      // use cached data
      secretboxPage = JSON.parse(cachedData)
    } else {
      const [animationAssets, secretboxInfo, buttonList] = await Promise.all([
        this.getAnimationAssets(secretBoxM.secret_box_id, secretBoxM.secret_box_type),
        this.getSecretboxInfo(secretBoxM.secret_box_id, secretBoxM.secret_box_type),
        this.getButtons(secretBoxM.secret_box_id, secretBoxM.secret_box_type)
      ])

      secretboxPage = {
        menu_asset: animationAssets.menu_asset,
        menu_se_asset: animationAssets.menu_se_asset,
        animation_assets: animationAssets,
        button_list: buttonList,
        secret_box_info: secretboxInfo
      }
      await Redis.set(`Secretbox:Page:${secretBoxM.secret_box_id}:${this.userId}`, JSON.stringify(secretboxPage), "ex", 86400)
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
        if (cost.cost_type === 1000 && (cost.item_id === 1 || cost.item_id === 8) && !payable) {
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
      throw new ErrorSecretboxNotAvailable()

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

  private async isSecretboxAvailable(secretboxM: ISecretboxM): Promise<boolean>
  private async isSecretboxAvailable(id: number): Promise<boolean>
  private async isSecretboxAvailable(input: number | ISecretboxM): Promise<boolean> {
    let secretboxM: ISecretboxM
    if (typeof input === "number") {
      secretboxM = await secretboxSVDB.get("SELECT start_date, end_date FROM secret_box_m WHERE secret_box_id = :id", {
        id: input
      })
    } else {
      secretboxM = input
    }
    const currentDate = Utils.toSpecificTimezone(9)
    if (
      secretboxM.start_date > currentDate ||
      secretboxM.end_date <= currentDate
    ) return false
    return true
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
