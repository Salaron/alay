import {
  secretboxSettings,
  costSettings,
  unitData,
  secretbox,
  stepInfo,
  knapsackInfo,
  secretboxButton,
  secretboxCost,
  secretboxEffectDetail,
  secretboxEffect,
  buttonType,
  secretboxType,
  animationType
} from "../typings/secretbox"
import { promisify } from "util"
import { readFile } from "fs"
import { Log } from "../core/log"
import { Connection } from "../core/database_wrappers/mysql"
import { Utils } from "./utils"
import { Item } from "./item"
import { User } from "./user"

const unitDB = sqlite3.getUnit()
const secretboxDB = sqlite3.getSecretbox()
const log = new Log("Common: Secretbox")

export class Secretbox {
  public secretBoxSettings: secretboxSettings = {}
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async generateList(userId: number): Promise<secretbox[]> {
    const list = await this.connection.query(`SELECT * FROM secretbox_list`)
    const result: secretbox[] = []
    await Promise.all(list.map(async (dbData: any) => {
      if (dbData.enabled === 0) return // disabled box
      if (
        dbData.enabled === 1 && (
          Utils.toSpecificTimezone(9) >= dbData.end_date || Utils.toSpecificTimezone(9) < dbData.start_date
        )
      ) return // time-depended box
      result.push(await this.generateTab(dbData, userId))
    }))
    return result
  }
  public async makePon(userId: number, secretBoxId: number, costId: number) {
    const item = new Item(this.connection)
    const user = new User(this.connection)

    const [, beforeUserInfo, costSettings, secretBoxInfo, cost] = await Promise.all([
      this.connection.query(`INSERT INTO secretbox_pon (user_id, secretbox_id, pon_count) VALUES (:user, :sbId, 0) ON DUPLICATE KEY UPDATE pon_count = pon_count + 0`, {
        user: userId,
        sbId: secretBoxId
      }),
      user.getUserInfo(userId),
      this.generateSettingsAndEffect(secretBoxId, costId),
      this.connection.first(`
        SELECT * FROM secretbox_list
        LEFT JOIN secretbox_pon ON secretbox_pon.secretbox_id = secretbox_list.secretbox_id
        WHERE secretbox_list.secretbox_id = :secretbox AND (user_id = :user OR user_id IS NULL)`, {
        secretbox: secretBoxId,
        user: userId
      }),
      this.connection.first(`SELECT cost_id, unit_count, amount, item_name FROM secretbox_cost WHERE cost_id = :cost`, {
        cost: costId
      })
    ])
    // check additional
    const additionalInfo = await this.generateAdditionalInfo(secretBoxId, secretBoxInfo.secretbox_type, userId)
    switch (secretBoxInfo.secretbox_type) {
      case 1: {
        const stepCost = await this.connection.first(`SELECT * FROM secretbox_cost JOIN secretbox_button ON secretbox_cost.button_id = secretbox_button.button_id WHERE secretbox_id = :id AND step_id = :step AND cost_id = :cost`, {
          id: secretBoxId,
          step: additionalInfo!.step,
          cost: costId
        })
        if (!stepCost) throw new Error(`Cost id doesn't match with step id`)
      }
    }

    const unitData = costSettings.settings[costId]
    if (secretBoxInfo.upper_limit != null && secretBoxInfo.upper_limit != 0) {
      if (secretBoxInfo.pon_count >= secretBoxInfo.upper_limit) throw new ErrorCode(1509)
    }
    const unitCount = cost.unit_count
    const ponCount = secretBoxInfo.pon_count == null ? 1 : secretBoxInfo.pon_count + 1

    await item.addItemToUser(userId, {
      name: cost.item_name
    }, parseInt(`-${cost.amount}`))

    const cardsIds: number[] = []
    const cardsRarity: number[] = []
    const guaranteeGainedList: number[] = []

    const getValue = (rarity: number) => {
      let result: unitData
      for (const data of unitData) {
        if (data.rarity == rarity) {
          result = data
        }
      }
      if (result!.rateup && result!.rateup.length != 0 && typeof result!.rateup[0] === "number") {
        if (Math.floor(Math.random() * 100) < result!.rateup) {
          result!.value = result!.rateup
        }
      }
      return result!
    }
    while (cardsIds.length < unitCount) {
      const rarityList = []
      for (const data of unitData) {
        if (data.guarantee && guaranteeGainedList.indexOf(data.rarity) === -1) guaranteeGainedList.push(data.rarity)
        for (let k = 0; k < data.weight; k++) {
          rarityList.push(data.rarity)
        }
      }

      const selectedRarity = rarityList.randomValue()

      const result = getValue(selectedRarity)
      cardsRarity.push(result.rarity)
      cardsIds.push(result!.value.randomValue().unit_id)
    }

    // add guarantee cards
    if (unitCount > 1) {
      await guaranteeGainedList.forEachAsync(async (rarity) => {
        if (cardsRarity.indexOf(rarity) != -1) return
        const result = getValue(rarity)
        const rndIndex = Math.floor(Math.random() * cardsIds.length)

        if (cardsRarity[rndIndex] >= rarity) return // don't kill this card
        cardsRarity[rndIndex] = rarity
        cardsIds[rndIndex] = result!.value.randomValue().unit_id
      })
    }

    const existingCards = (await this.connection.query(`SELECT unit_id FROM user_unit_album WHERE unit_id IN (${cardsIds.join(",")}) AND user_id = :user`, { user: userId })).map((c: any) => {
      return c.unit_id
    })

    const cardsResult: any[] = []
    await cardsIds.forEachAsync(async (card: number) => {
      const res = await item.addPresent(userId, {
        name: "card",
        id: card
      }, `Gained from Scouting Box "${secretBoxInfo.name}"`, 1, true)
      res.unit_rarity_id = (await unitDB.get("SELECT rarity FROM unit_m WHERE unit_id=?", [res.unit_id])).rarity
      res.new_unit_flag = existingCards.indexOf(res.unit_id) === -1
      res.is_hit = null
      cardsResult.push(res)
    })

    const [afterUserInfo, items, supports] = await Promise.all([
      user.getUserInfo(userId),
      this.connection.first("SELECT bt_tickets, green_tickets, box_gauge FROM users WHERE user_id=:user", { user: userId }),
      user.getSupportUnits(userId)
    ])

    const addedGauge = secretBoxInfo.add_gauge * unitCount
    const result: any = {
      is_unit_max: false,
      item_list: [ // TODO
        {
          item_id: 1,
          amount: items.green_tickets
        },
        {
          item_id: 5,
          amount: items.bt_tickets
        }
      ],
      gauge_info: {
        max_gauge_point: 100,
        gauge_point: items.box_gauge,
        added_gauge_point: addedGauge
      },
      button_list: await this.generateButton(secretBoxInfo.secretbox_id, secretBoxInfo.name, secretBoxInfo.secretbox_type, userId),
      secret_box_info: {
        secret_box_id: secretBoxInfo.secretbox_id,
        secret_box_type: secretBoxInfo.secretbox_type,
        name: secretBoxInfo.name,
        description: secretBoxInfo.description,
        start_date: secretBoxInfo.start_date,
        end_date: secretBoxInfo.end_date,
        show_end_date: secretBoxInfo.enabled === 1,
        add_gauge: secretBoxInfo.add_gauge,
        pon_count: ponCount,
        pon_upper_limit: secretBoxInfo.upper_limit === null ? 0 : secretBoxInfo.upper_limit,
        additional_info: await this.generateAdditionalInfo(secretBoxInfo.secretbox_id, secretBoxInfo.secretbox_type, userId)
      },
      secret_box_items: {
        unit: cardsResult,
        item: []
      },
      before_user_info: beforeUserInfo,
      after_user_info: afterUserInfo,
      lowest_rarity: 2,
      promotion_performance_rate: 10,
      secret_box_parcel_type: 2,
      limit_bonus_info: [],
      limit_bonus_rewards: [],
      unit_support_list: supports
    }

    const totalGauge = items.box_gauge + addedGauge
    if (totalGauge >= 100) {
      result.secret_box_items.item.push({
        owning_item_id: 0,
        item_id: 5,
        add_type: 1000,
        amount: Math.floor(totalGauge / 100),
        item_category_id: 5,
        reward_box_flag: false
      })
    }
    await this.connection.query("UPDATE users SET bt_tickets=bt_tickets+:am, box_gauge=:g WHERE user_id=:user", {
      user: userId,
      am: Math.floor(totalGauge / 100),
      g: totalGauge % 100
    })
    await this.connection.query(`UPDATE secretbox_pon SET pon_count = pon_count + 1 WHERE user_id = :user AND secretbox_id = :sbId`, {
      user: userId,
      sbId: secretBoxId
    })

    return result
  }

  private async generateTab(dbData: any, userId: number): Promise<secretbox> {
    const settingsAndEffects = await this.generateSettingsAndEffect(dbData.secretbox_id)
    let pon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
      user: userId,
      id: dbData.secretbox_id
    })
    if (!pon) pon = { pon_count: 1}
    const result: secretbox = {
      page_title_asset: dbData.menu_title_asset,
      url: `/webview.php/secretbox/detail?id=${dbData.secretbox_id}`,
      animation_assets: {
        type: dbData.animation_type,
        background_asset: dbData.bg_asset,
        additional_asset_1: dbData.navi_asset,
        additional_asset_2: dbData.title_asset,
        additional_asset_3: dbData.appeal_asset
      },
      effect_list: settingsAndEffects.effect_list,
      effect_detail_list: settingsAndEffects.effect_detail_list,
      button_list: await this.generateButton(dbData.secretbox_id, dbData.name, dbData.secretbox_type, userId),
      secret_box_info: {
        member_category: dbData.member_category,
        secret_box_id: dbData.secretbox_id,
        secret_box_type: dbData.secretbox_type,
        name: dbData.name,
        description: dbData.description,
        start_date: dbData.start_date,
        end_date: dbData.end_date,
        show_end_date: dbData.enabled === 1,
        add_gauge: dbData.add_gauge,
        pon_count: pon.pon_count,
        pon_upper_limit: dbData.upper_limit,
        additional_info: await this.generateAdditionalInfo(dbData.secretbox_id, dbData.secretbox_type, userId)
      }
    }

    this.secretBoxSettings[dbData.secretbox_id] = settingsAndEffects.settings
    return result
  }
  private async generateButton(secretBoxId: number, secretBoxName: string, secretBoxType: number, userId: number): Promise<secretboxButton[]> {
    const result: secretboxButton[] = []
    switch (secretBoxType) {
      case 1: { // step up
        const stepSettings = await this.connection.first(`SELECT * FROM secretbox_step_up_settings WHERE secretbox_id = :id`, { id: secretBoxId })
        if (!stepSettings) throw new Error(`Box #${secretBoxId} doesn't have step up settings`)
        let userPon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
          user: userId,
          id: secretBoxId
        })
        if (!userPon) userPon = { pon_count: 0 }
        let currentStep = userPon.pon_count + 1
        if (currentStep % stepSettings.end_step === 0) currentStep = stepSettings.end_step
        else if (stepSettings.reset_type === 1) currentStep = currentStep % stepSettings.end_step
        const stepCost = await this.connection.first(`SELECT * FROM secretbox_button WHERE secretbox_id = :id AND step_id = :step`, {
          id: secretBoxId,
          step: currentStep
        })
        const button: any = {
          secret_box_button_type: 2, // default is 2
          cost_list: [],
          secret_box_name: secretBoxName,
          balloon_asset: undefined
        }
        if (!stepCost || currentStep > stepSettings.end_step) {
          button.show_cost = {
            cost_type: 3001,
            unit_count: 11
          }
        } else {
          button.secret_box_button_type = stepCost.type
          button.balloon_asset = stepCost.balloon_asset == null ? undefined : stepCost.balloon_asset
          button.cost_list = await this.generateCost(stepCost.button_id, userId)
        }
        result.push(button)
        break
      }
      default: {
        const buttons = await this.connection.query(`SELECT * FROM secretbox_button WHERE secretbox_id = :id ORDER BY type ASC LIMIT 3`, {
          id: secretBoxId
        })

        await Promise.all(buttons.map(async (button: any) => {
          result.push({
            secret_box_button_type: button.type,
            cost_list: await this.generateCost(button.button_id, userId),
            secret_box_name: secretBoxName,
            balloon_asset: button.balloon_asset === null ? undefined : button.balloon_asset
          })
        }))
      }
    }

    return result
  }
  private async generateCost(buttonId: number, userId: number): Promise<secretboxCost[]> {
    const costs = await this.connection.query(`SELECT cost_id, unit_count, amount, item_name FROM secretbox_cost WHERE button_id = :id`, {
      id: buttonId
    })
    const amount = await this.connection.first("SELECT sns_coin, green_tickets, bt_tickets, game_coin, social_point FROM users WHERE user_id=:user", {
      user: userId
    })
    const result: secretboxCost[] = []
    await Promise.all(costs.map((cost: any) => {
      const item = Item.nameToType(cost.item_name)
      let payable = false
      if (item.itemType === 3001) payable = amount.sns_coint >= cost.amount
      else if (item.itemType === 3000 && item.itemId === 2) payable = amount.game_coin >= cost.amount
      else if (item.itemType === 3002 && item.itemId === 3) payable = amount.social_point >= cost.amount
      else if (item.itemType === 1000 && item.itemId === 1) payable = amount.green_tickets >= cost.amount
      else if (item.itemType === 1000 && item.itemId === 5) payable = amount.bt_tickets >= cost.amount
      result.push({
        id: cost.cost_id,
        payable,
        unit_count: cost.unit_count,
        type: item.itemType,
        item_id: item.itemId,
        amount: cost.amount
      })
    }))
    return result
  }
  private async generateSettingsAndEffect(secretboxId: number, costId?: number) {
    let query = `SELECT unit_data_file, cost_id FROM secretbox_cost
      JOIN secretbox_button ON secretbox_cost.button_id = secretbox_button.button_id
      JOIN secretbox_list ON secretbox_button.secretbox_id = secretbox_list.secretbox_id
      WHERE secretbox_list.secretbox_id = :secretbox`
    if (costId) query += ` AND secretbox_cost.cost_id = :cost`
    const costs = await this.connection.query(query, { secretbox: secretboxId, cost: costId })
    if (costs.length === 0) throw new Error(`Cost data is missing`)

    const result = {
      settings: <costSettings>{},
      effect_list: <secretboxEffect[]>[],
      effect_detail_list: <secretboxEffectDetail[]>[]
    }
    // just for optimization
    const processedFiles = <any>{}
    await costs.forEachAsync(async (cost: any) => {
      try {
        if (processedFiles[cost.unit_data_file] != undefined) {
          result.settings[cost.cost_id] = result.settings[processedFiles[cost.unit_data_file]]
          return
        }
        const data = await promisify(readFile)(`${rootDir}/data/secretbox/${cost.unit_data_file}`, "utf-8")
        const settings: unitData[] = []
        await JSON.parse(data).forEachAsync(async (unitData: unitData) => {
          if (
            !(Type.isNull(unitData.unit_type_id) || Type.isArray(unitData.unit_type_id)) ||
            !(Type.isNull(unitData.query) || Type.isArray(unitData.query) || Type.isString(unitData.query)) ||
            !Type.isInt(unitData.rarity) ||
            !Type.isInt(unitData.weight)
          ) throw new Error(`File with unit_data: ${rootDir}/data/secretbox/${cost.unit_data_file} is invalid`)
          unitData.value = []
          // Prepare rateup units and effects
          let excludeRateup = false
          let rateupIds: number[] = []
          if (
            Type.isArray(unitData.rateup) &&
            Type.isArray(unitData.rateup_hidden) &&
            Type.isInt(unitData.weight)
          ) {
            excludeRateup = true
            await unitData.rateup!.forEachAsync(async (rateup: any) => {
              const sbAsset = await secretboxDB.get("SELECT secret_box_asset_id FROM secret_box_asset_m WHERE unit_id=?", [rateup])
              if (!sbAsset) return // this unit doesn't have sb asset and client can't show this card
              result.effect_list.push({
                type: 1,
                secret_box_asset_id: sbAsset.secret_box_asset_id,
                start_date: "2018-11-03 00:00:00",
                end_date: "2036-11-03 00:00:00"
              })
              result.effect_detail_list.push({
                type: 1,
                secret_box_asset_id: sbAsset.secret_box_asset_id
              })
            })
            await unitData.rateup_hidden!.forEachAsync(async (rateup: number) => {
              const sbAsset = await secretboxDB.get("SELECT secret_box_asset_id FROM secret_box_asset_m WHERE unit_id=?", [rateup])
              if (!sbAsset) return // this unit doesn't have sb asset and client can't show this card
              result.effect_detail_list.push({
                type: 1,
                secret_box_asset_id: sbAsset.secret_box_asset_id
              })
            })

            unitData.rateup = Utils.mergeArrayDedupe([unitData.rateup, unitData.rateup_hidden]) // concat rateup and hidden rateup
            rateupIds = unitData.rateup
            unitData.rateup = await Promise.all(unitData.rateup.map(async (rateup: any) => {
              const result = await unitDB.get(`
                SELECT unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
                FROM unit_m JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
                WHERE unit_id=?`, [rateup])
              return {
                unit_id: result.unit_id,
                unit_number: result.unit_number,
                name: result.unit_name,
                attribute: result.attribute_id,
                skill: result.skill_name
              }
            }))
          }

          // Prepare units
          if (unitData.unit_type_id != null) {
            const result = await unitDB.all(`
                SELECT unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
                FROM unit_m LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
                WHERE rarity = ? AND unit_id NOT IN (${rateupIds.join(",")}) AND unit_type_id IN (${unitData.unit_type_id.join(",")})`, [unitData.rarity])
            for (const data of result) {
              unitData.value.push({
                unit_id: data.unit_id,
                unit_number: data.unit_number,
                name: data.unit_name,
                attribute: data.attribute_id,
                skill: data.skill_name
              })
            }
          }
          if (unitData.query != null && unitData.query.length > 0) {
            let _query: string[] = [] // tslint:disable-line
            if (Type.isString(unitData.query)) _query.push(unitData.query.toString())
            else _query = <string[]>unitData.query
            await _query.forEachAsync(async (q: string) => {
              if (q.toLowerCase().includes("order")) {
                throw new Error(`Never use "ORDER BY" in custom query`)
              }
              if (excludeRateup) {
                if (q.slice(-1) === ";") q = q.slice(0, -1) // remove ";" -- the end of query
                if (q.toLowerCase().includes("where")) {
                  q = q.splice(q.toLowerCase().lastIndexOf("where") + 6, 0, `unit_id NOT IN (${rateupIds.join(",")}) AND `)
                } else {
                  q += ` WHERE unit_id NOT IN (${rateupIds.join(",")})`
                }
              }
              q += " ORDER BY unit_id DESC"
              const result = await unitDB.all(q)
              for (const data of result) {
                const res = await unitDB.get(`
                  SELECT unit_id, unit_m.name as unit_name, unit_number, attribute_id, unit_skill_m.name as skill_name
                  FROM unit_m LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
                  WHERE unit_id=?`, [data.unit_id])
                unitData.value!.push({
                  unit_id: res.unit_id,
                  unit_number: res.unit_number,
                  name: res.unit_name,
                  attribute: res.attribute_id,
                  skill: res.skill_name
                })
              }
            })
          }
          settings.push(unitData)
        })

        // save result
        processedFiles[cost.unit_data_file] = cost.cost_id
        result.settings[cost.cost_id] = settings
      } catch (err) {
        if (err.code === "ENOENT") return log.error(`File data for secretBox #${secretboxId} is missing`)
        else log.error(err)
      }
    })
    return result
  }

  public async generateAdditionalInfo(secretBoxId: number, secretBoxType: number, userId: number) {
    switch (secretBoxType) {
      case 1: {
        const stepSettings = await this.connection.first(`SELECT * FROM secretbox_step_up_settings WHERE secretbox_id = :id`, { id: secretBoxId })
        if (!stepSettings) throw new Error(`Box #${secretBoxId} doesn't have step up settings`)
        let userPon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
          user: userId,
          id: secretBoxId
        })
        if (!userPon) userPon = { pon_count: 0 }
        let currentStep = userPon.pon_count + 1
        if (stepSettings.reset_type === 1) currentStep = currentStep % stepSettings.end_step
        if (currentStep === 0) currentStep = stepSettings.end_step
        return <stepInfo>{
          secret_box_type: secretBoxType,
          step: currentStep,
          end_step: stepSettings.end_step,
          show_step: currentStep,
          term_count: 0,
          step_up_bonus_bonus_item_list: []
        }
      }
      case 3: { // TODO
        break
      }
      default: return undefined
    }
  }
}
