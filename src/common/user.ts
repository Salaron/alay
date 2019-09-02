import { Connection } from "../core/database_wrappers/mysql"
import { Unit } from "./unit"

interface userParams {
  vanish?: number,
  mirror?: number,
  hp?: number,
  event?: number
}

export class User {
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async getUserInfo(userId: number) {
    let data = await this.connection.first(`
    SELECT user_id, name, level, exp, previous_exp, next_exp, game_coin, sns_coin, free_sns_coin, paid_sns_coin, social_point, 
    unit_max, energy_max, energy_full_time, 0 as energy_full_need_time, over_max_energy, friend_max, unlock_random_live_muse, 
    unlock_random_live_aqours, insert_date, update_date, tutorial_state, user_id as invite_code, energy_max as current_energy,
    0 as waiting_unit_max, 5 as training_energy, 5 as training_energy_max FROM users WHERE user_id=:user`, {
      user: userId
    })

    data.lp_recovery_item = []
    return data
  }
  public async getSupportUnits(userId: number) {
    return await this.connection.query("SELECT unit_id, amount FROM user_support_unit WHERE user_id=:user AND amount > 0", {
      user: userId
    })
  }
  public async getRemovableSkillInfo(userId: number) {
    let skills = await this.connection.query(`
    select o.user_id AS user_id,
    o.unit_removable_skill_id AS unit_removable_skill_id,
    o.total_amount AS total_amount,
    (select count(*) from (
      user_unit_removable_skill_equip e join units on((units.unit_owning_user_id = e.unit_owning_user_id))
    ) where ((e.unit_removable_skill_id = o.unit_removable_skill_id) and (units.user_id = o.user_id))) AS equipped_amount,o.insert_date AS insert_date from user_unit_removable_skill_owning o 
    WHERE user_id=:user`, { user: userId })
    let equip = await this.connection.query("SELECT e.unit_owning_user_id, unit_removable_skill_id FROM user_unit_removable_skill_equip as e JOIN units as u ON e.unit_owning_user_id=u.unit_owning_user_id WHERE user_id=:user;", { user: userId })

    let result = {
      owning_info: skills,
      equipment_info: <any>{}
    }
    for (let i = 0; i < equip.length; i++) {
      let e = equip[i]
      if (!result.equipment_info[e.unit_owning_user_id]) {
        result.equipment_info[e.unit_owning_user_id] = {
          unit_owning_user_id: e.unit_owning_user_id,
          detail: []
        }
      }
      result.equipment_info[e.unit_owning_user_id].detail.push({ unit_removable_skill_id: e.unit_removable_skill_id })
    }
    if (equip.length === 0) result.equipment_info = []
    return result
  }

  public static getClassSystemStatus(userId: number) {
    return {
      rank_info: {
        before_class_rank_id: 1,
        after_class_rank_id: 1
      },
      complete_flag: false,
      is_open: false,
      is_visible: false
    }
  }

  public async getCenterUnitInfo(userId: number) {
    let data = await this.connection.first(`
    SELECT units.unit_owning_user_id FROM users 
    JOIN user_unit_deck ON users.user_id = user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    WHERE users.user_id = :user
    `, {
      user: userId
    })
    if (!data) throw new Error(`Center unit data is missing`)
    return await new Unit(this.connection).getUnitDetail(data.unit_owning_user_id)
  }
  public async getNaviUnitInfo(userId: number) {
    let data = await this.connection.first(`SELECT partner_unit FROM users WHERE user_id = :user`, {
      user: userId
    })
    if (!data) throw new Error(`Navi unit data is missing`)
    return await new Unit(this.connection).getUnitDetail(data.partner_unit)
  }

  public async getFriendStatus(currentUser: number, anotherUser: number) {
    let friend = await this.connection.first(`SELECT * FROM user_friend WHERE (initiator_id = :user1 OR recipient_id = :user1) AND (initiator_id = :user2 OR recipient_id = :user2)`, {
      user1: currentUser,
      user2: anotherUser
    })
    if (!friend) return 0 // not a friend
    if (friend.status === 1) return 1 // friend
    if (friend.recipient_id === currentUser && friend.initiator_id === anotherUser) return 2 // approval wait
    return 3 // pending
  }

  public async getParams(userId: number, params: string[] = []): Promise<userParams> {
    let userParams = await this.connection.query(`SELECT param_name as name, value FROM user_params WHERE user_id=:user`, {
      user: userId
    })

    let result: any = {}

    for (let i = 0; i < userParams.length; i++) {
      if (params.includes(userParams[i].name)) {
        result[userParams[i].name] = userParams[i].value
      } else {
        result[userParams[i].name] = userParams[i].value
      }
    }
    return result
  }

  public async addExp(userId: number, amount: number, multiplier = 1) {
    let result: { level: number, from_exp: number }[] = []

    let userInfo = await this.connection.first(`SELECT level, previous_exp, next_exp, exp FROM users WHERE user_id = :user`, {
      user: userId
    })
    let level = userInfo.level
    let previousExp = userInfo.previous_exp
    let userExp = userInfo.exp + (amount * multiplier)
    let nextExp = userInfo.next_exp
    while (userExp >= nextExp) {
      // formula taken from AuahDark's private server (NPPS)
      // https://github.com/MikuAuahDark/NPPS_2/blob/0f7200bccd193d717341bad2855594f6f7fa1075/modules/include.user.php#L543
      previousExp = Math.round(21 + Math.pow(level, 2.12) / 2 + 0.5) 
      level++
      nextExp = Math.round(21 + Math.pow(level, 2.12) / 2 + 0.5)

      result.push({
        level: level,
        from_exp: nextExp
      })
    }
    await this.connection.query("UPDATE users SET level=:lvl, exp=:exp, previous_exp=:prev, next_exp=:next WHERE user_id=:user", {
      lvl: level,
      exp: userExp,
      prev: previousExp,
      next: nextExp,
      user: userId
    })

    return result
  }
}