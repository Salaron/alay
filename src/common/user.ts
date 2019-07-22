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
}
(global as any).User = User