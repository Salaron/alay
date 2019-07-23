import { Connection } from "../core/database"

export class User {
  connection: Connection
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
}
(global as any).User = User