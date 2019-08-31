import { Connection } from "../core/database_wrappers/mysql"
import { Unit } from "./unit"

const unitDB = sqlite3.getUnit()
interface ItemObject {
  name?: string
  type?: number
  id?: number | null
}

export class Item {
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public static nameToType(name: string, itemId?: number | null) {
    if (!Type.isString(name)) throw new Error(`Argument should be string`)

    switch (name) {
      case "loveca":
      case "sns_coin":
      case "sns":
      case "love_gems":
      case "lg": {
        return {
          itemType: 3001,
          itemId: null
        }
      }

      case "gold":
      case "game_coin":
      case "coins": {
        return {
          itemType: 3000,
          itemId: 2
        }
      }

      case "social":
      case "friend_pts":
      case "social_point":
      case "social_points": {
        return {
          itemType: 3002,
          itemId: 3
        }
      }

      case "member":
      case "unit":
      case "units":
      case "card":
      case "cards": {
        return {
          itemType: 1001,
          itemId: itemId || null
        }
      }

      case "green_ticket":
      case "green_tickets":
      case "gt_tickets":
      case "gt_ticket":
      case "gt": {
        return {
          itemType: 1000,
          itemId: 1
        }
      }

      case "blue_ticket":
      case "blue_tickets":
      case "bt_tickets":
      case "bt_ticket":
      case "bt": {
        return {
          itemType: 1000,
          itemId: 5
        }
      }

      case "exchange_point":
      case "ep": {
        return {
          itemType: 3006,
          itemId: itemId || null
        }
      }

      case "sis":
      case "skill":
      case "school_idol_skill": {
        return {
          itemType: 5500,
          itemId: itemId || null
        }
      }

      case "live":
      case "lives": {
        return {
          itemType: 5000,
          itemId: itemId || null
        }
      }

      case "award":
      case "awards":
      case "badge": {
        return {
          itemType: 5100,
          itemId: itemId || null
        }
      }

      case "background":
      case "backgrounds":
      case "bg": {
        return {
          itemType: 5200,
          itemId: itemId || null
        }
      }

      default: {
        throw new Error(`"${name}" is not support`)
      }
    }
  }

  public static typeToName(itemType: number, itemId?: number | null) {
    switch (itemType) {
      case 1000: {
        if (itemId === 1) return "green_tickets"
        if (itemId === 2) return "social_point"
        if (itemId === 3) return "game_coin"
        if (itemId === 5) return "bt_tickets"
        throw new Error(`Unknown item_id: ${itemId}`)
      }
      case 1001: return "unit"
      case 3000: return "game_coin"
      case 3001: return "sns_coin"
      case 3002: return "social_point"
      case 3006: return "exchange_point"
      case 5000: return "live"
      case 5100: return "award"
      case 5200: return "background"
      case 5500: return "school_idol_skill"
      default: {
        throw new Error(`Unknown item_type: ${itemType}`)
      }
    }
  }

  public static correctName(name: string, itemId?: number | null) {
    let type = this.nameToType(name, itemId)
    return this.typeToName(type.itemType, itemId)
  }
  public static getIncentiveId(itemType: number, itemId?: number | null) {
    switch(itemType){
      case 1000:
      case 1001: return itemId
      case 3000: return 1
      case 3001: return 4
      case 3002: return 2
      default: return 0
    }
  }

  public async addItemToUser(userId: number, item: ItemObject, amount = 1) {
    if (!item.name && !item.type && !item.id) throw new Error(`Item object is empty`)

    if (typeof item.name === "string" && item.type == null) {
      item.name = Item.correctName(item.name, item.id)
      item.type = Item.nameToType(item.name, item.id).itemType
    }
    if (typeof item.type === "number" && item.name == null) {
      item.name = Item.typeToName(item.type, item.id)
    }

    if (
      (item.type === 1001 || 
      item.type === 3006 || 
      item.type === 5500
      ) && item.id === null
    ) throw new Error("You should need to provide itemId")

    switch(item.type){
      case 1000:
      case 3000:
      case 3001:
      case 3002: {
        await this.connection.query(`UPDATE users SET ${item.name}=${item.name} + ${amount} WHERE user_id=${userId}`)
        return
      }

      case 1001: {
        let unit = new Unit(this.connection)
        return await unit.addUnit(userId, <number>item.id, { amount: amount })
      }

      case 3006: {
        await this.connection.query(`UPDATE user_exchange_point SET amount=amount + ${amount} WHERE user_id=${userId} AND rarity=${item.id}`)
        return
      }

      case 5000: {
        throw new Error(`Not implemented yet.`) // TODO
      }
      case 5100: {
        await this.connection.query(`INSERT IGNORE INTO user_award_unlock (user_id, award_id) VALUES (:user, :award)`, {
          user: userId,
          award: item.id
        })
        return
      }
      case 5200: {
        await this.connection.query(`INSERT IGNORE INTO user_background_unlock (user_id, background_id) VALUES (:user, :bg)`, {
          user: userId,
          bg: item.id
        })
        return
      }
      case 5500: {
        await this.connection.query(`INSERT INTO user_unit_removable_skill_owning (user_id, unit_removable_skill_id, total_amount) VALUES (${userId}, ${item.id}, ${amount}) \
        ON DUPLICATE KEY UPDATE total_amount=total_amount + ${amount}`)
        return
      }
      default: {
        throw new Error(`Type "${item.type}" not supported`)
      }
    }
  }

  public async addPresent(userId: number, item: ItemObject, message: string, amount = 1, history = false) {
    if (!item.name && !item.type && !item.id) throw new Error(`Item object is empty`)
    if (typeof item.name === "string" && item.type == null) {
      let ntt = Item.nameToType(item.name, item.id)
      item.type = ntt.itemType
      item.id = ntt.itemId
      item.name = Item.correctName(item.name, item.id)
      
    }
    if (typeof item.type === "number" && item.name == null) {
      item.name = Item.typeToName(item.type, item.id)
    }

    let unitData: any = {}
    if (item.type === 1001) {
      unitData = await unitDB.get("SELECT rarity, attribute_id FROM unit_m WHERE unit_id=:id", { id: item.id })
    }

    let res = await this.connection.query(`
    INSERT INTO reward_table (
      user_id, amount, item_type, incentive_message, item_id, attribute, rarity
    ) VALUES (
      ${userId}, 
      ${amount}, 
      ${item.type}, 
      '${message.replace(/[\'']/g, "\\'")}', 
      ${item.id || null},
      ${unitData.attribute_id || null}, 
      ${unitData.rarity || null}
    )`)
    if (!history) return (<any>res).insertId

    return await this.openPresent(userId, (<any>res).insertId)
  }

  public async openPresent(userId: number, incentiveId: number) {
    let present = await this.connection.first(`SELECT * FROM reward_table WHERe user_id=:user AND incentive_id=:id AND collected IS NULL`, { 
      user: userId, 
      id: incentiveId 
    })
    if (!present) throw new Error(`Present is already collected`)

    await this.connection.query(`UPDATE reward_table SET collected = 1, opened_date = CURRENT_TIMESTAMP WHERE user_id = :user AND incentive_id = :id`, {
      user: userId,
      id: incentiveId
    })

    let result: any = await this.addItemToUser(userId, { 
      type: present.item_type, 
      id: present.item_id
    }, present.amount)
    if (present.item_type === 1001) {
      result.add_type = 1001
      result.amount = present.amount
      result.incentive_id = incentiveId
      result.reward_box_flag = false
      result.new_unit_flag = true
      return result
    }
    return {
      item_id: present.item_id || null,
      add_type: present.item_type,
      amount: present.amount,
      reward_box_flag: false,
      incentive_id: incentiveId
    }
  }
}