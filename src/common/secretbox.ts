import { readFile } from "fs"
import { promisify } from "util"
import { Logger } from "../core/logger"
import { BaseAction } from "../models/actions"
import { IRarityData, ISecretbox, ISecretboxButton, ISecretboxCost, ISecretboxData, ISecretboxEffect, ISecretboxEffectDetail, ISecretboxSettings, IStepInfo, IStepUpSettings } from "../models/secretbox"
import { Utils } from "./utils"
import { CommonModule } from "../models/common"
import { Connection } from "../core/database/mysql"
import { ErrorAPI } from "../models/error"

const log = new Logger("Secretbox")
const unitDB = sqlite3.getUnit()
const secretboxDB = sqlite3.getSecretbox()

let secretboxSettings: ISecretboxSettings = {}
async function updateSettings() {
  const connection = await Connection.beginTransaction()
  let costs
  try {
    costs = await connection.query(`SELECT * FROM secretbox_list JOIN secretbox_button ON secretbox_list.secretbox_id = secretbox_button.secretbox_id JOIN secretbox_cost ON secretbox_button.button_id = secretbox_cost.button_id`)
    await connection.commit()
  } catch (err) {
    await connection.rollback()
  } finally {
    connection.release()
  }
  if (!costs) return

  let processedFiles = <{ [file: string]: IRarityData[] }>{}
  await Promise.all(costs.map(async cost => {
    if (!secretboxSettings[cost.secretbox_id]) secretboxSettings[cost.secretbox_id] = {}

    if (processedFiles[cost.unit_data_file] != undefined) {
      secretboxSettings[cost.secretbox_id][cost.cost_id] = processedFiles[cost.unit_data_file]
      return
    }

    try {
      let data = await promisify(readFile)(`./data/secretbox/${cost.unit_data_file}`, "utf-8")
      secretboxSettings[cost.secretbox_id][cost.cost_id] = processedFiles[cost.unit_data_file] = <IRarityData[]>(await Promise.all(JSON.parse(data).map(async (rarityData: IRarityData) => {
        if (
          !(Type.isNullDef(rarityData.unit_id) || Type.isArray(rarityData.unit_id)) ||
          !(Type.isNull(rarityData.unit_type_id) || Type.isArray(rarityData.unit_type_id)) ||
          !(Type.isNull(rarityData.query) || Type.isArray(rarityData.query) || Type.isString(rarityData.query)) ||
          !Type.isInt(rarityData.rarity) ||
          !Type.isInt(rarityData.weight)
        ) {
          log.warn(`File with unit_data: data/secretbox/${cost.unit_data_file} is invalid`)
          return
        }
        rarityData.unit_data_by_id = {}
        rarityData.rateup_unit_ids = []

        let excludeRateup = false
        if (Type.isArray(rarityData.rateup_unit_id) && Type.isInt(rarityData.rateup_weight)) {
          excludeRateup = true
          rarityData.rateup_unit_ids = Utils.mergeArrayDedupe([rarityData.rateup_unit_id, rarityData.rateup_hidden_unit_id])
          const units = await unitDB.all(`
            SELECT
              unit_id, normal_icon_asset, unit_number, attribute_id, unit_skill_m.name as skill_name
            FROM
              unit_m
            LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
            WHERE rarity = :rarity AND unit_id IN (${rarityData.rateup_unit_ids.join(",")})`, {
            rarity: rarityData.rarity
          })
          for (let unit of units) {
            rarityData.unit_data_by_id[unit.unit_id] = {
              unit_id: unit.unit_id,
              unit_number: unit.unit_number,
              normal_icon_asset: unit.normal_icon_asset,
              attribute: unit.attribute_id,
              skill: unit.skill_name
            }
          }
        }

        if (Type.isArray(rarityData.unit_id)) {
          const units = await unitDB.all(`
            SELECT
              unit_id, normal_icon_asset, unit_number, attribute_id, unit_skill_m.name as skill_name
            FROM
              unit_m
            LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
            WHERE rarity = :rarity AND unit_id NOT IN (${rarityData.rateup_unit_ids.join(",")}) AND unit_id IN (${rarityData.unit_id.join(",")})`, {
            rarity: rarityData.rarity
          })
          for (let unit of units) {
            rarityData.unit_data_by_id[unit.unit_id] = {
              unit_id: unit.unit_id,
              unit_number: unit.unit_number,
              normal_icon_asset: unit.normal_icon_asset,
              attribute: unit.attribute_id,
              skill: unit.skill_name
            }
          }
        } else {
          rarityData.unit_id = []
        }
        if (Array.isArray(rarityData.unit_type_id) && rarityData.unit_type_id.length > 0) {
          const units = await unitDB.all(`
            SELECT
              unit_id, normal_icon_asset, unit_number, attribute_id, unit_skill_m.name as skill_name
            FROM
              unit_m
            LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
            WHERE rarity = :rarity AND unit_id NOT IN (${rarityData.rateup_unit_ids.join(",")}) AND unit_type_id IN (${rarityData.unit_type_id.join(",")})`, {
            rarity: rarityData.rarity
          })
          for (let unit of units) {
            rarityData.unit_id.push(unit.unit_id)
            rarityData.unit_data_by_id[unit.unit_id] = {
              unit_id: unit.unit_id,
              unit_number: unit.unit_number,
              normal_icon_asset: unit.normal_icon_asset,
              attribute: unit.attribute_id,
              skill: unit.skill_name
            }
          }
        }

        if (rarityData.query != null && rarityData.query.length > 0) {
          let query: string[] = []
          if (Type.isString(rarityData.query)) query.push(rarityData.query)
          else query = rarityData.query

          await Promise.all(query.map(async query => {
            const units = await unitDB.all(query)
            for (let unit of units) {
              if (excludeRateup && rarityData.rateup_unit_ids.includes(unit.unit_id)) continue

              const data = await unitDB.get(`
                SELECT
                  unit_id, normal_icon_asset, unit_number, attribute_id, unit_skill_m.name as skill_name
                FROM
                  unit_m
                LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
                WHERE unit_id = :unit`, {
                unit: unit.unit_id
              })
              rarityData.unit_id!.push(data.unit_id)
              rarityData.unit_data_by_id[data.unit_id] = {
                unit_id: data.unit_id,
                unit_number: data.unit_number,
                normal_icon_asset: unit.normal_icon_asset,
                attribute: data.attribute_id,
                skill: data.skill_name
              }
            }
          }))
        }
        // sort from older to new
        rarityData.rateup_unit_ids.sort((a, b) => b - a)
        rarityData.unit_id = [...new Set(rarityData.unit_id)].sort((a, b) => b - a) // remove duples and sort

        return rarityData
      }))).filter(rarityData => {
        if (!rarityData) return false
        return true
      })
    } catch (err) {
      log.error(err)
    }
  }))
}

export async function init() {
  setInterval(() => {
    updateSettings().catch(err => log.error(err))
  }, 1200000)
  await updateSettings()
}

export class Secretbox extends CommonModule {
  public secretboxSettings = secretboxSettings
  constructor(action: BaseAction) {
    super(action)
  }

  public async getSecretboxList(userId: number): Promise<ISecretbox[]> {
    if (Config.server.debug_mode) await updateSettings()

    let list = await this.connection.query(`SELECT * FROM secretbox_list WHERE (start_date >= :date AND end_date < :date AND enabled = 1) OR enabled = 2`, {
      date: Utils.toSpecificTimezone(9)
    })
    return <ISecretbox[]>(await Promise.all(list.map(async secretbox => {
      return await this.getTab(userId, secretbox)
    }))).filter(secretbox => {
      if (!secretbox) return false
      return true
    })
  }
  public async updateSecretboxSettings() {
    await updateSettings()
  }

  public async makePon(userId: number, secretboxId: number, costId: number) {
    const rarityData = this.secretboxSettings[secretboxId][costId]
    const [beforeUserInfo, costData, secretboxTab] = await Promise.all([
      this.action.user.getUserInfo(userId),
      this.getCosts(userId, costId, true),
      this.getTab(userId, secretboxId),
      this.connection.query(`INSERT INTO secretbox_pon (user_id, secretbox_id, pon_count) VALUES (:user, :sbId, 0) ON DUPLICATE KEY UPDATE pon_count = pon_count + 0`, {
        user: userId,
        sbId: secretboxId
      })
    ])
    if (!secretboxTab) throw new ErrorAPI(1500, "not exists") // ERROR_CODE_SECRET_BOX_NOT_EXIST
    if (costData.payable === false) throw new ErrorAPI(1507, "oops") // ERROR_CODE_SECRET_BOX_REMAINING_COST_IS_NOT_ENOUGH
    if (secretboxTab.secret_box_info.pon_upper_limit != null && secretboxTab.secret_box_info.pon_upper_limit != 0) {
      if (secretboxTab.secret_box_info.pon_count >= secretboxTab.secret_box_info.pon_upper_limit) throw new ErrorAPI(1509, "nope") // ERROR_CODE_SECRET_BOX_UPPER_LIMIT
    }

    switch (secretboxTab.secret_box_info.secret_box_type) {
      case 1: { // step match check
        let stepCost = await this.connection.first(`SELECT * FROM secretbox_cost JOIN secretbox_button ON secretbox_cost.button_id = secretbox_button.button_id WHERE secretbox_id = :id AND step_id = :step AND cost_id = :cost`, {
          id: secretboxId,
          step: secretboxTab.secret_box_info.additional_info!.step,
          cost: costId
        })

        if (!stepCost && (<IStepInfo>secretboxTab.secret_box_info.additional_info).reset_type != 2) throw new Error(`Cost id doesn't match with step id`)
        stepCost = await this.connection.first("SELECT * FROM secretbox_button WHERE secretbox_id = :id ORDER BY step_id DESC", {
          id: secretboxId
        })
        if ((<IStepInfo>secretboxTab.secret_box_info.additional_info).reset_type === 2 && secretboxTab.secret_box_info.additional_info!.step < stepCost.step_id) throw new Error(`Same`)
      }
    }

    await this.action.item.addItemToUser(userId, {
      type: costData.type,
      id: costData.item_id
    }, parseInt(`-${costData.amount}`))
    beforeUserInfo.gaugePoint = (await this.connection.first("SELECT box_gauge FROM users WHERE user_id = :user", { user: userId })).box_gauge

    // process unit
    const gainedUnitIds: number[] = [] // first we need to get unit ids
    const unitRarities: number[] = [] // for guarantee

    for (let count = 0; gainedUnitIds.length < costData.unit_count; count++) {
      let rarities: IRarityData[] = []
      for (const data of rarityData) {
        for (let i = 0; i < data.weight; i++) {
          rarities.push(data)
        }
      }

      let selectedRarity = rarities.randomValue()

      let type: string[] = []
      if (selectedRarity.rateup_unit_ids.length > 0 && selectedRarity.rateup_weight && selectedRarity.rateup_weight > 0) {
        for (let i = 0; i < selectedRarity.rateup_weight; i++) {
          type.push("rateup")
        }
        for (let i = 0; i < Math.max(100 - selectedRarity.rateup_weight, 0); i++) {
          type.push("normal")
        }
      } else {
        type.push("normal")
      }

      if (type.randomValue() === "rateup") {
        gainedUnitIds.push(selectedRarity.rateup_unit_ids.randomValue())
      } else {
        gainedUnitIds.push(selectedRarity.unit_id!.randomValue())
      }
      unitRarities.push(selectedRarity.rarity)
    }

    if (costData.unit_count > 1) {
      for (const data of rarityData) {
        if (data.guarantee && !unitRarities.includes(data.rarity)) {
          let randomIndex = Math.floor(Math.random() * gainedUnitIds.length)
          if (unitRarities[randomIndex] >= data.rarity) continue // don't kill this card
          unitRarities[randomIndex] = data.rarity
          gainedUnitIds[randomIndex] = data.unit_id!.randomValue()
        }
      }
    }

    // result
    const gainedUnits = await Promise.all(gainedUnitIds.map(async id => {
      let unitData = await this.action.item.addPresent(userId, {
        name: "card",
        id
      }, `Gained from Scouting Box "${secretboxTab.secret_box_info.name}"`, 1, true)
      unitData.is_hit = false
      unitData.is_signed = false
      return unitData
    }))
    const gainedItems: any[] = []
    const addedGauge = secretboxTab.secret_box_info.add_gauge * costData.unit_count
    const totalGauge = beforeUserInfo.gaugePoint + addedGauge
    if (totalGauge >= 100) {
      gainedItems.push({
        item_id: 5,
        add_type: 1000,
        amount: Math.floor(totalGauge / 100),
        item_category_id: 5,
        reward_box_flag: false
      })
    }

    // get after info
    const [afterSecretboxButtons, afterUserInfo, afterSupportList, userItems] = await Promise.all([
      this.getButtons(userId, secretboxId),
      this.action.user.getUserInfo(userId),
      this.action.user.getSupportUnits(userId),
      this.connection.first("SELECT sns_coin, bt_tickets, green_tickets FROM users WHERE user_id = :user", {
        user: userId
      }),
      this.connection.execute("UPDATE users SET bt_tickets = bt_tickets + :amount, box_gauge = :gauge WHERE user_id = :user", {
        amount: Math.floor(totalGauge / 100),
        gauge: totalGauge % 100,
        user: userId
      }),
      this.connection.execute(`UPDATE secretbox_pon SET pon_count = pon_count + 1 WHERE user_id = :user AND secretbox_id = :sbId`, {
        user: userId,
        sbId: secretboxId
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
        gauge_point: beforeUserInfo.gaugePoint + addedGauge,
        added_gauge_point: addedGauge
      },
      button_list: afterSecretboxButtons,
      secret_box_info: secretboxTab.secret_box_info,
      secret_box_items: {
        unit: gainedUnits,
        item: gainedItems
      },
      before_user_info: beforeUserInfo,
      after_user_info: afterUserInfo,
      free_muse_gacha_flag: false,
      free_aqours_gacha_flag: false,
      lowest_rarity: Utils.createObjCopy(rarityData).sort((a, b) => a.rarity - b.rarity)[0].rarity,
      promotion_performance_rate: 10, // idk...
      secret_box_parcel_type: 2, // idk...
      limit_bonus_info: [],
      limit_bonus_rewards: [],
      unit_support_list: afterSupportList
    }
  }

  private async getTab(userId: number, secretboxData: ISecretboxData): Promise<ISecretbox | undefined>
  private async getTab(userId: number, secretboxId: number): Promise<ISecretbox>
  private async getTab(userId: number, secretboxData: ISecretboxData | number): Promise<ISecretbox | undefined> {
    if (Type.isInt(secretboxData)) {
      let data = await this.connection.first(`SELECT * FROM secretbox_list WHERE ((start_date >= :date AND end_date < :date AND enabled = 1) OR enabled = 2) AND secretbox_id = :id`, {
        date: Utils.toSpecificTimezone(9),
        id: secretboxData
      })
      if (!data) throw new ErrorAPI(1508)
      secretboxData = <ISecretboxData>data
    }

    const [buttons, ponData, additionalInfo] = await Promise.all([
      this.getButtons(userId, secretboxData),
      this.getUserPon(userId, secretboxData.secretbox_id),
      this.getAdditionalInfo(userId, secretboxData)
    ])
    if (!buttons) return
    const effect = await this.getEffects(secretboxData, additionalInfo)

    const tab: ISecretbox = {
      page_title_asset: secretboxData.menu_title_asset,
      url: `/webview.php/secretbox/detail?id=${secretboxData.secretbox_id}`,
      animation_assets: {
        type: secretboxData.animation_type,
        background_asset: secretboxData.bg_asset,
        additional_asset_1: secretboxData.navi_asset,
        additional_asset_2: secretboxData.title_asset,
        additional_asset_3: secretboxData.appeal_asset
      },
      effect_list: effect.effectList,
      effect_detail_list: effect.effectDetailList,
      button_list: buttons,
      secret_box_info: {
        member_category: secretboxData.member_category,
        secret_box_id: secretboxData.secretbox_id,
        secret_box_type: secretboxData.secretbox_type,
        name: secretboxData.name,
        description: secretboxData.description,
        start_date: secretboxData.start_date,
        end_date: secretboxData.end_date,
        show_end_date: secretboxData.enabled === 1 ? secretboxData.end_date : undefined,
        add_gauge: secretboxData.add_gauge,
        pon_count: ponData!.pon_count,
        pon_upper_limit: secretboxData.upper_limit,
        additional_info: additionalInfo
      }
    }

    return tab
  }

  private async getButtons(userId: number, secretboxData: ISecretboxData): Promise<ISecretboxButton[] | false>
  private async getButtons(userId: number, secretboxId: number): Promise<ISecretboxButton[]>
  private async getButtons(userId: number, secretboxData: ISecretboxData | number): Promise<ISecretboxButton[] | false> {
    if (Type.isInt(secretboxData)) {
      let data = await this.connection.first(`SELECT * FROM secretbox_list WHERE ((start_date >= :date AND end_date < :date AND enabled = 1) OR enabled = 2) AND secretbox_id = :id`, {
        date: Utils.toSpecificTimezone(9),
        id: secretboxData
      })
      if (!data) throw new ErrorAPI(1508)
      secretboxData = <ISecretboxData>data
    }

    switch (secretboxData.secretbox_type) {
      case 5:  // stub a.k.a. blue ticket box
      case 0: { // default
        const buttons = await this.connection.query(`SELECT * FROM secretbox_button WHERE secretbox_id = :id ORDER BY type ASC LIMIT 3`, {
          id: secretboxData.secretbox_id
        })
        if (buttons.length === 0) return false

        return await Promise.all(buttons.map(async (button: any) => {
          return {
            secret_box_button_type: button.type,
            cost_list: await this.getCosts(userId, button.button_id),
            secret_box_name: (<ISecretboxData>secretboxData).name,
            balloon_asset: button.balloon_asset === null ? undefined : button.balloon_asset
          }
        }))
      }
      case 1: { // step up
        const secretboxInfo = await this.getAdditionalInfo(userId, secretboxData)
        let stepButton = await this.connection.first("SELECT * FROM secretbox_button WHERE secretbox_id = :id AND step_id = :step", {
          id: secretboxData.secretbox_id,
          step: secretboxInfo!.show_step
        })
        if (secretboxData.secretbox_type === 1 && secretboxInfo && secretboxInfo.reset_type === 2) {
          // use last step data instead
          stepButton = await this.connection.first("SELECT * FROM secretbox_button WHERE secretbox_id = :id ORDER BY step_id DESC", {
            id: secretboxData.secretbox_id
          })
        }
        if (!stepButton && !secretboxData.always_visible) return false

        const button: ISecretboxButton = {
          secret_box_button_type: 2, // default is 2
          cost_list: [],
          secret_box_name: secretboxData.name,
          balloon_asset: undefined
        }
        if (!stepButton || secretboxInfo!.show_step > stepButton.end_step) {
          button.show_cost = {
            cost_type: 3001,
            unit_count: 11
          }
        } else {
          button.secret_box_button_type = stepButton.type
          button.balloon_asset = stepButton.balloon_asset == null ? undefined : stepButton.balloon_asset
          button.cost_list = await this.getCosts(userId, stepButton.button_id)
        }
        return [button]
      }
      default: {
        throw new Error(`Secretbox type "${secretboxData.secretbox_type}" is not implemented yet.`)
      }
    }
  }
  private async getCosts(userId: number, buttonId: number): Promise<ISecretboxCost[]>
  private async getCosts(userId: number, costId: number, useCostId: true): Promise<ISecretboxCost>
  private async getCosts(userId: number, id: number, useCostId: boolean = false): Promise<ISecretboxCost[] | ISecretboxCost> {
    const [costs, userItems] = await Promise.all([
      this.connection.query(`SELECT cost_id, unit_count, amount, item_name FROM secretbox_cost WHERE ${useCostId ? "cost_id" : "button_id"} = :id`, {
        id
      }),
      this.connection.first("SELECT user_id, sns_coin, green_tickets, bt_tickets, game_coin, social_point FROM users WHERE user_id = :user", {
        user: userId
      })
    ])
    if (costs.length === 0) throw new Error(`Costs for ${useCostId ? "cost_id" : "button_id"} #${id} is missing`)

    let result = costs.map((cost: { item_name: string; amount: number; cost_id: any; unit_count: any }) => {
      const item = this.action.item.nameToType(cost.item_name)
      let payable = false
      if (item.itemType === 3001) payable = userItems.sns_coin >= cost.amount
      else if (item.itemType === 3000 && item.itemId === 2) payable = userItems.game_coin >= cost.amount
      else if (item.itemType === 3002 && item.itemId === 3) payable = userItems.social_point >= cost.amount
      else if (item.itemType === 1000 && item.itemId === 1) payable = userItems.green_tickets >= cost.amount
      else if (item.itemType === 1000 && item.itemId === 5) payable = userItems.bt_tickets >= cost.amount

      return {
        id: cost.cost_id,
        payable,
        unit_count: cost.unit_count,
        type: item.itemType,
        item_id: item.itemId,
        amount: cost.amount
      }
    })
    if (useCostId) return result[0]
    return result
  }

  private async getAdditionalInfo(userId: number, secretboxData: ISecretboxData) {
    switch (secretboxData.secretbox_type) {
      case 1: { // step up
        const settings = await this.getStepUpSettings(secretboxData.secretbox_id)
        const pon = await this.getUserPon(userId, secretboxData.secretbox_id)

        let currentStep = pon.pon_count + 1
        if (settings.reset_type === 1) currentStep = currentStep % settings.end_step
        if (currentStep === 0) currentStep = settings.end_step

        return <IStepInfo>{
          secret_box_type: 1,
          step: currentStep,
          end_step: settings.end_step,
          show_step: currentStep,
          term_count: 0,
          step_up_bonus_bonus_item_list: [],
          reset_type: settings.reset_type
        }
      }
      default: return undefined
    }
  }
  private async getEffects(secretboxData: ISecretboxData, additionalInfo?: IStepInfo) {
    // oh god stupid crutch ...
    let justObject: any = {}
    let useObjectFromAbove = false
    if (secretboxData.secretbox_type === 1) {
      useObjectFromAbove = true
      justObject[(await this.connection.first(`SELECT * FROM secretbox_cost JOIN secretbox_button ON secretbox_cost.button_id = secretbox_button.button_id WHERE secretbox_id = :id AND step_id = :step`, {
        id: secretboxData.secretbox_id,
        step: additionalInfo!.step
      })).cost_id] = "lol"
    }

    let effectList: ISecretboxEffect[] = []
    let effectDetailList: ISecretboxEffectDetail[] = []

    let ids: number[] = []
    for (let cost of Object.keys(useObjectFromAbove ? justObject : this.secretboxSettings[secretboxData.secretbox_id])) {
      let costData = this.secretboxSettings[secretboxData.secretbox_id][parseInt(cost)]
      for (let rarity of costData) {
        if (rarity.rateup_unit_id) {
          for (let unitId of rarity.rateup_unit_ids) {
            let asset = await secretboxDB.get("SELECT secret_box_asset_id FROM secret_box_asset_m WHERE unit_id = :unit", {
              unit: unitId
            })
            if (!asset || ids.includes(unitId)) continue
            ids.push(unitId)
            if (rarity.rateup_hidden_unit_id && !rarity.rateup_hidden_unit_id.includes(unitId)) {
              effectList.push({
                type: 1,
                secret_box_asset_id: asset.secret_box_asset_id,
                start_date: "2018-11-03 00:00:00",
                end_date: "2036-11-03 00:00:00"
              })
            }
            effectDetailList.push({
              type: 1,
              secret_box_asset_id: asset.secret_box_asset_id
            })
          }
        }
      }
    }

    return {
      effectList,
      effectDetailList
    }
  }

  private async getStepUpSettings(secretboxId: number): Promise<IStepUpSettings> {
    const settings = await this.connection.first(`SELECT * FROM secretbox_step_up_settings WHERE secretbox_id = :id`, {
      id: secretboxId
    })
    if (!settings) throw new Error(`Secretbox #${secretboxId} doesn't have step up settings`)
    return settings
  }
  private async getUserPon(userId: number, secretboxId: number): Promise<{ pon_count: number }> {
    let pon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
      user: userId,
      id: secretboxId
    })
    if (!pon) pon = { pon_count: 0 }
    return pon
  }
}
