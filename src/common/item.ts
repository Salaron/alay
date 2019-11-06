import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"

interface ItemObject {
  name?: string
  type?: number
  id?: number | null
}

interface IItemRewardInfo {
  item_id: number | null
  add_type: number
  reward_box_flag: boolean
  amount: number
}

export class Item extends CommonModule {
  constructor(action: BaseAction) {
    super(action)
  }

  public nameToType(name: string, itemId?: number | null) {
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
        throw new Error(`"${name}" is not implemented`)
      }
    }
  }

  public typeToName(itemType: number, itemId?: number | null) {
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

  public correctName(name: string, itemId?: number | null) {
    const type = this.nameToType(name, itemId)
    return this.typeToName(type.itemType, itemId || type.itemId)
  }
  public getIncentiveId(itemType: number, itemId?: number | null) {
    switch (itemType) {
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
      item.name = this.correctName(item.name, item.id)
      item.type = this.nameToType(item.name, item.id).itemType
    }
    if (typeof item.type === "number" && item.name == null) {
      item.name = this.typeToName(item.type, item.id)
    }

    if (
      (item.type === 1001 ||
        item.type === 3006 ||
        item.type === 5500
      ) && item.id === null
    ) throw new Error("You should need to provide itemId")

    let itemInfo: IItemRewardInfo = {
      item_id: item.id || null,
      add_type: <number>item.type,
      reward_box_flag: false,
      amount
    }
    switch (item.type) {
      case 1001: { // card
        return await this.action.unit.addUnit(userId, <number>item.id, { amount })
      }

      case 1000:
      case 3000:
      case 3001:
      case 3002: {
        await this.connection.query(`UPDATE users SET ${item.name}=${item.name} + ${amount} WHERE user_id=${userId}`)
        break
      }

      case 3006: {
        await this.connection.query(`UPDATE user_exchange_point SET exchange_point=exchange_point + ${amount} WHERE user_id=${userId} AND rarity=${item.id}`)
        break
      }

      case 5000: {
        throw new Error(`Not implemented yet.`) // TODO
      }
      case 5100: {
        await this.connection.query(`INSERT IGNORE INTO user_award_unlock (user_id, award_id) VALUES (:user, :award)`, {
          user: userId,
          award: item.id
        })
        break
      }
      case 5200: {
        await this.connection.query(`INSERT IGNORE INTO user_background_unlock (user_id, background_id) VALUES (:user, :bg)`, {
          user: userId,
          bg: item.id
        })
        break
      }
      case 5500: {
        await this.connection.query(`INSERT INTO user_unit_removable_skill_owning (user_id, unit_removable_skill_id, total_amount) VALUES (${userId}, ${item.id}, ${amount}) \
        ON DUPLICATE KEY UPDATE total_amount=total_amount + ${amount}`)
        break
      }
      default: {
        throw new Error(`Type "${item.type}" is not implemented`)
      }
    }

    return itemInfo
  }

  public async addPresent(userId: number, item: ItemObject, message: string, amount = 1, open = false) {
    if (!item.name && !item.type && !item.id) throw new Error(`Item object is empty`)
    if (typeof item.name === "string" && item.type == null) {
      const ntt = this.nameToType(item.name, item.id)
      item.type = ntt.itemType
      item.id = ntt.itemId
      item.name = this.correctName(item.name, item.id)

    }
    if (typeof item.type === "number" && item.name == null) {
      item.name = this.typeToName(item.type, item.id)
    }

    const res = await this.connection.execute(`
    INSERT INTO reward_table (user_id, amount, item_type, incentive_message, item_id) VALUES (
      ${userId},
      ${amount},
      ${item.type},
      '${message.replace(/[\'']/g, "\\'")}',
      ${item.id || null}
    )`)
    if (!open) return <IItemRewardInfo>{
      item_id: item.id || null,
      add_type: item.type,
      reward_box_flag: true,
      amount
    }

    return await this.openPresent(userId, res.insertId)
  }

  public async openPresent(userId: number, incentiveId: number) {
    const present = await this.connection.first(`SELECT amount, item_id, item_type FROM reward_table WHERE user_id= :user AND incentive_id = :id AND opened_date IS NULL`, {
      user: userId,
      id: incentiveId
    })
    if (!present) throw new Error(`Present is already collected`)

    await this.connection.query(`UPDATE reward_table SET opened_date = CURRENT_TIMESTAMP WHERE user_id = :user AND incentive_id = :id`, {
      user: userId,
      id: incentiveId
    })

    const result: any = await this.addItemToUser(userId, {
      type: present.item_type,
      id: present.item_id
    }, present.amount)
    if (present.item_type === 1001) {
      result.add_type = 1001
      result.amount = present.amount
      result.incentive_id = incentiveId
      result.reward_box_flag = false
      return result
    }
    return <IItemRewardInfo>{
      item_id: present.item_id || null,
      add_type: present.item_type,
      amount: present.amount,
      reward_box_flag: false,
      incentive_id: incentiveId
    }
  }
}
