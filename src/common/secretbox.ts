import { Connection } from "../core/database_wrappers/mysql"
import { Log } from "../core/log"
import { Item } from "./item"
import * as types from "../typings/secretbox"
import { Utils } from "./utils"
import { promisify } from "util"
import { readFile } from "fs"

const log = new Log("Secretbox")
const unitDB = sqlite3.getUnit()
const secretboxDB = sqlite3.getSecretbox()

let secretboxSettings: types.secretboxSettings = {}
async function updateSettings() {
  let costs = await MySQLconnectionPool.query(`SELECT * FROM secretbox_list JOIN secretbox_button ON secretbox_list.secretbox_id = secretbox_button.secretbox_id JOIN secretbox_cost ON secretbox_button.button_id = secretbox_cost.button_id`)

  let processedFiles = <{ [file: string]: types.rarityData[] }>{}
  await Promise.all(costs.map(async cost => {
    if (!secretboxSettings[cost.secretbox_id]) secretboxSettings[cost.secretbox_id] = {}

    if (processedFiles[cost.unit_data_file] != undefined) {
      secretboxSettings[cost.secretbox_id][cost.cost_id] = processedFiles[cost.unit_data_file]
      return
    }

    try {
      let data = await promisify(readFile)(`${rootDir}/data/secretbox/${cost.unit_data_file}`, "utf-8")
      secretboxSettings[cost.secretbox_id][cost.cost_id] = processedFiles[cost.unit_data_file] = <types.rarityData[]>(await Promise.all(JSON.parse(data).map(async (rarityData: types.rarityData) => {
        if (
          !(Type.isNullDef(rarityData.unit_id) || Type.isArray(rarityData.unit_id)) ||
          !(Type.isNull(rarityData.unit_type_id) || Type.isArray(rarityData.unit_type_id)) ||
          !(Type.isNull(rarityData.query) || Type.isArray(rarityData.query) || Type.isString(rarityData.query)) ||
          !Type.isInt(rarityData.rarity) ||
          !Type.isInt(rarityData.weight)
        ) {
          log.warn(`File with unit_data: ${rootDir}/data/secretbox/${cost.unit_data_file} is invalid`)
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
              unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
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
              name: unit.unit_name,
              attribute: unit.attribute_id,
              skill: unit.skill_name
            }
          }
        }

        if (Type.isArray(rarityData.unit_id)) {
          const units = await unitDB.all(`
            SELECT
              unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
            FROM
              unit_m
            LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
            WHERE rarity = :rarity AND unit_id NOT IN (${rarityData.rateup_unit_ids.join(",")}) AND unit_id IN (${rarityData.unit_id.join(",")}) ORDER BY unit_id DESC`, {
            rarity: rarityData.rarity
          })
          for (let unit of units) {
            rarityData.unit_data_by_id[unit.unit_id] = {
              unit_id: unit.unit_id,
              unit_number: unit.unit_number,
              name: unit.unit_name,
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
              unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
            FROM
              unit_m
            LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
            WHERE rarity = :rarity AND unit_id NOT IN (${rarityData.rateup_unit_ids.join(",")}) AND unit_type_id IN (${rarityData.unit_type_id.join(",")}) ORDER BY unit_id DESC`, {
            rarity: rarityData.rarity
          })
          for (let unit of units) {
            rarityData.unit_id.push(unit.unit_id)
            rarityData.unit_data_by_id[unit.unit_id] = {
              unit_id: unit.unit_id,
              unit_number: unit.unit_number,
              name: unit.unit_name,
              attribute: unit.attribute_id,
              skill: unit.skill_name
            }
          }
        }

        if (rarityData.query != null && rarityData.query.length > 0) {
          let query: string[] = []
          if (Type.isString(rarityData.query)) query.push(rarityData.query)
          else query = rarityData.query

          await query.forEachAsync(async query => {
            if (query.toLowerCase().includes("order")) {
              throw new Error(`Never use "ORDER BY" in custom query`)
            }

            if (excludeRateup) {
              if (query.slice(-1) === ";") query = query.slice(0, -1) // remove ";" -- the end of query
              if (query.toLowerCase().includes("where")) { // insert before other conditions
                query = query.splice(query.toLowerCase().lastIndexOf("where") + 6, 0, `unit_id NOT IN (${rarityData.rateup_unit_ids.join(",")}) AND `)
              } else { // add our condition
                query += ` WHERE unit_id NOT IN (${rarityData.rateup_unit_ids.join(",")})`
              }
            }

            query += " ORDER BY unit_id DESC" // order should be always from new to old
            const units = await unitDB.all(query)
            for (let unit of units) {
              const data = await unitDB.get(`
                SELECT
                  unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
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
                name: data.unit_name,
                attribute: data.attribute_id,
                skill: data.skill_name
              }
            }
          })
        }
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

export class Secretbox {
  public secretboxSettings = secretboxSettings
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async getSecretboxList(userId: number): Promise<types.secretbox[]> {
    if (Config.server.debug_mode) await updateSettings()

    let list = await this.connection.query(`SELECT * FROM secretbox_list WHERE (start_date >= :date AND end_date < :date AND enabled = 1) OR enabled = 2`, {
      date: Utils.toSpecificTimezone(9)
    })
    return <types.secretbox[]>(await Promise.all(list.map(async secretbox => {
      return await this.generateTab(userId, secretbox)
    }))).filter(secretbox => {
      if (!secretbox) return false
      return true
    })
  }
  public async updateSecretboxSettings() {
    await updateSettings()
  }

  private async generateTab(userId: number, secretboxData: types.secretboxData): Promise<types.secretbox | undefined> {
    let [buttons, ponData, additionalInfo, effect] = await Promise.all([
      this.generateButtons(userId, secretboxData),
      this.getUserPon(userId, secretboxData.secretbox_id),
      this.generateAdditionalInfo(userId, secretboxData),
      this.generateEffects(secretboxData.secretbox_id)
    ])
    if (!buttons) return

    const tab: types.secretbox = {
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
        pon_count: ponData.pon_count,
        pon_upper_limit: secretboxData.upper_limit,
        additional_info: additionalInfo
      }
    }

    return tab
  }

  private async generateButtons(userId: number, secretboxData: types.secretboxData): Promise<types.secretboxButton[] | false> {
    switch (secretboxData.secretbox_type) {
      case 0: { // default
        const buttons = await this.connection.query(`SELECT * FROM secretbox_button WHERE secretbox_id = :id ORDER BY type ASC LIMIT 3`, {
          id: secretboxData.secretbox_id
        })
        if (buttons.length === 0) return false

        return await Promise.all(buttons.map(async (button: any) => {
          return {
            secret_box_button_type: button.type,
            cost_list: await this.generateCost(userId, button.button_id),
            secret_box_name: secretboxData.name,
            balloon_asset: button.balloon_asset === null ? undefined : button.balloon_asset
          }
        }))
      }
      case 1: { // step up
        const secretboxInfo = await this.generateAdditionalInfo(userId, secretboxData)
        const stepButton = await this.connection.first("SELECT * FROM secretbox_button WHERE secretbox_id = :id AND step_id = :step", {
          id: secretboxData.secretbox_id,
          step: secretboxInfo!.show_step
        })
        if (!stepButton && !secretboxData.always_visible) return false

        const button: types.secretboxButton = {
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
          button.cost_list = await this.generateCost(userId, stepButton.button_id)
        }
        return [button]
      }
      default: {
        throw new Error(`Secretbox type "${secretboxData.secretbox_type}" is not implemented yet.`)
      }
    }
  }
  private async generateCost(userId: number, buttonId: number): Promise<types.secretboxCost[]> {
    const [costs, userItems] = await Promise.all([
      this.connection.query(`SELECT cost_id, unit_count, amount, item_name FROM secretbox_cost WHERE button_id = :id`, {
        id: buttonId
      }),
      this.connection.first("SELECT user_id, sns_coin, green_tickets, bt_tickets, game_coin, social_point FROM users WHERE user_id = :user", {
        user: userId
      })
    ])

    return costs.map(cost => {
      const item = Item.nameToType(cost.item_name)
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
  }

  private async generateAdditionalInfo(userId: number, secretboxData: types.secretboxData) {
    switch (secretboxData.secretbox_type) {
      case 1: { // step up
        const settings = await this.getStepUpSettings(secretboxData.secretbox_id)
        const pon = await this.getUserPon(userId, secretboxData.secretbox_id)

        let currentStep = pon.pon_count + 1
        if (settings.reset_type === 1) currentStep = currentStep % settings.end_step
        if (currentStep === 0) currentStep = settings.end_step

        return <types.stepInfo>{
          secret_box_type: 1,
          step: currentStep,
          end_step: settings.end_step,
          show_step: currentStep,
          term_count: 0,
          step_up_bonus_bonus_item_list: []
        }
      }
      default: return undefined
    }
  }
  private async generateEffects(secretboxId: number) {

    let effectList: types.secretboxEffect[] = []
    let effectDetailList: types.secretboxEffectDetail[] = []

    let ids: number[] = []
    for (let cost of Object.keys(this.secretboxSettings[secretboxId])) {
      let costData = this.secretboxSettings[secretboxId][parseInt(cost)]
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

  private async getStepUpSettings(secretboxId: number): Promise<types.stepUpSettings> {
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
