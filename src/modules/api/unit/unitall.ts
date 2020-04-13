import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    // TODO: add waiting units
    const active = await this.connection.query("SELECT * FROM units WHERE user_id = :user AND deleted = 0", { user: this.user_id })
    return {
      status: 200,
      result: {
        active: active.map(data => this.parseUnitData(data)),
        waiting: []
      }
    }
  }

  private parseUnitData(data: any) {
    const isMaxRank = data.rank >= data.max_rank
    return {
      unit_owning_user_id: data.unit_owning_user_id,
      unit_id: data.unit_id,
      exp: data.exp,
      next_exp: data.next_exp,
      level: data.level,
      max_level: data.max_level,
      level_limit_id: 0, // TODO
      rank: data.rank,
      max_rank: data.max_rank,
      love: data.love,
      max_love: data.max_love,
      unit_skill_level: data.unit_skill_level,
      unit_skill_exp: data.unit_skill_level,
      max_hp: data.max_hp,
      unit_removable_skill_capacity: data.removable_skill_capacity,
      favorite_flag: !!data.favorite_flag,
      display_rank: data.display_rank,
      is_rank_max: isMaxRank,
      is_love_max: isMaxRank && data.love >= data.max_love,
      is_level_max: isMaxRank && data.level >= data.max_level,
      is_signed: this.unit.isSignUnit(data.unit_id),
      is_skill_level_max: data.unit_skill_level >= data.max_skill_level,
      is_removable_skill_capacity_max: isMaxRank && data.removable_skill_capacity >= data.max_removable_skill_capacity,
      insert_date: data.insert_date
    }
  }
}
