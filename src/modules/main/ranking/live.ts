import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramTypes() {
    return {
      live_difficulty_id: TYPE.STRING
    }
  }

  public async execute() {
    const parsedNumber = this.params.live_difficulty_id.match(/\d+/g)
    if (parsedNumber === null) throw new ErrorCode(1, "live_difficulty_id doesn't contain numbers")
    this.params.live_difficulty_id = parsedNumber[0]

    const users = await this.connection.query(`
    SELECT
      users.user_id, users.name, users.level,
      unit_id, units.level as unit_level, units.max_level,
      units.rank as unit_rank, units.max_rank as unit_max_rank, units.love, units.max_love, units.unit_skill_level, units.display_rank, units.unit_skill_exp,
      units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool, user_live_status.hi_score,
      FIND_IN_SET(user_live_status.hi_score, (SELECT GROUP_CONCAT(hi_score ORDER BY hi_score DESC) FROM user_live_status WHERE live_difficulty_id=:diff )) AS rank
    FROM users
      JOIN user_live_status ON users.user_id=user_live_status.user_id AND user_live_status.live_difficulty_id=:diff
      JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
      JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    ORDER BY hi_score DESC LIMIT 10`, { diff: this.params.live_difficulty_id })

    const result = []
    for (const user of users) {
      result.push({
        rank: user.rank,
        score: user.hi_score,
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

    if (result.length === 0) throw new ErrorCode(1602)

    return {
      status: 200,
      result: {
        total_cnt: result.length,
        page: 0,
        items: result
      }
    }
  }
}
