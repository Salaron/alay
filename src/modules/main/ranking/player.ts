import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let offset = 0
    const limit = 20
    let page = 0

    if (typeof this.params.page != "undefined") {
      if (typeof this.params.page != "number" || parseInt(this.params.page) != this.params.page) throw new Error(`Invalid request`)
      offset = this.params.page * 20
      page = this.params.page
    }
    if (typeof this.params.id != "undefined") {
      if (typeof this.params.id != "number" || parseInt(this.params.id) != this.params.id) throw new ErrorCode(1601)

      const pos = await this.connection.first(`SELECT FIND_IN_SET(level, (SELECT GROUP_CONCAT(level ORDER BY level DESC) FROM users)) as rank FROM users WHERE user_id=:user`, {
        user: this.params.id
      })
      if (pos.rank === 0) throw new ErrorCode(1601)

      page = Math.floor(pos.rank / 20)
      offset = page * 20
    }

    const users = await this.connection.query(`
    SELECT
    users.user_id, users.name, users.level,
    unit_id, units.level as unit_level, units.max_level,
    units.rank as unit_rank, units.max_rank as unit_max_rank, units.love, units.max_love, units.unit_skill_level, units.display_rank, units.unit_skill_exp,
    units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool,
    FIND_IN_SET(users.level, (SELECT GROUP_CONCAT(level ORDER BY level DESC) FROM users)) AS rank
    FROM users
    JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    ORDER BY users.level DESC LIMIT ${offset}, ${limit}`)

    const result = []
    for (const user of users) {
      result.push({
        rank: user.rank,
        score: user.level,
        user_data: {
          user_id: user.user_id,
          name: user.name,
          level: user.level
        },
        center_unit_info: {
          unit_id: user.unit_id,
          love: user.love,
          level: user.unit_level,
          smile: user.stat_smile,
          cute: user.stat_pure,
          cool: user.stat_cool,
          rank: user.rank,
          display_rank: user.display_rank,
          is_rank_max: user.unit_rank >= user.unit_max_rank,
          is_love_max: user.love >= user.max_love,
          is_level_max: user.unit_level >= user.max_level,
          unit_skill_exp: user.unit_skill_exp,
          unit_removable_skill_capacity: user.removable_skill_capacity,
          removable_skill_ids: []
        },
        setting_award_id: user.setting_award_id
      })
    }

    if (result.length === 0) throw new ErrorCode(1601)
    const count = await this.connection.first(`SELECT count(level) as cnt FROM users`)

    return {
      status: 200,
      result: {
        total_cnt: count.cnt,
        page,
        items: result
      }
    }
  }
}
