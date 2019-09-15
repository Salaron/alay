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
      buff: TYPE.INT,
      event_id: TYPE.INT
    }
  }

  public async execute() {
    let offset = 0
    let limit = 0
    let page = 0

    // simple scrolling
    if (typeof this.params.page != "undefined") {
      if (typeof this.params.id != "undefined" || typeof this.params.rank != "undefined") throw new Error(`Invalid request [form.page][1]`)
      if (typeof this.params.page != "number" || parseInt(this.params.page) != this.params.page) throw new Error(`Invalid request [form.page][2]`)

      if (this.params.buff > 0) { // scroll up
        page = this.params.page
        offset = this.params.page * 20
        limit = 20 + this.params.buff
      } else { // scroll down
        page = this.params.page
        limit = 20 - this.params.buff
        offset = this.params.page * 20 + this.params.buff
      }
    }

    // jump to specific user
    if (typeof this.params.id != "undefined") {
      if (typeof this.params.page != "undefined" || typeof this.params.rank != "undefined") throw new Error(`Invalid request [id][1]`)
      if (typeof this.params.id != "number" || parseInt(this.params.id) != this.params.id) throw new Error(`Invalid request [id][2]`)

      // find user position at event ranking
      const pos = await this.connection.first(`SELECT FIND_IN_SET(event_point, (SELECT GROUP_CONCAT(event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) as rank FROM event_ranking WHERE user_id=:user AND event_id=:event`, {
        user: this.params.id,
        event: this.params.event_id
      })
      // this user is missing in event ranking
      if (pos.rank === 0 || pos.length === 0) throw new ErrorCode(1601)
      // calculate page that contains this user
      page = Math.floor(pos.rank / 20)
      // set offset
      offset = page * 20
      // set limit (here for safety)
      limit = 20
    }

    // jump to specific 'tier'
    if (typeof this.params.rank != "undefined") {
      if (typeof this.params.id != "undefined" || typeof this.params.page != "undefined") throw new Error(`Invalid request [rank][1]`)
      if (!Type.isString(this.params.rank)) throw new Error(`Invalid request [rank][2]`)

      // find tier starting position
      const pos = await this.connection.first(`SELECT FIND_IN_SET(event_point, (SELECT GROUP_CONCAT(event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) as rank FROM event_ranking WHERE event_id=:event HAVING rank < :r`, {
        r: this.params.rank,
        event: this.params.event_id
      })
      // this tier doesn't contains a players
      if (pos.rank === 0 || pos.length === 0) throw new ErrorCode(1601)
      // calculate tier start page
      page = Math.floor(pos.rank / 20)
      // set offset
      offset = page * 20
      // set limit (here for safety)
      limit = 20
    }

    const users = await this.connection.query(`
    SELECT
    users.user_id, users.name, users.level,
    unit_id, units.level as unit_level, units.max_level,
    units.rank as unit_rank, units.max_rank as unit_max_rank, units.love, units.max_love, units.unit_skill_level, units.display_rank, units.unit_skill_exp,
    units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool, event_point,
    FIND_IN_SET(event_point, (SELECT GROUP_CONCAT(event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) AS rank
    FROM users
    JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    JOIN event_ranking ON event_ranking.user_id = users.user_id AND event_ranking.event_id = :event
    WHERE event_point > 0
    ORDER BY event_point DESC LIMIT ${offset}, ${limit}`, { event: this.params.event_id })

    const result = []
    for (const user of users) {
      result.push({
        rank: user.rank,
        score: user.event_point,
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
    const count = await this.connection.first(`SELECT count(event_point) as cnt FROM event_ranking WHERE event_id = :event AND event_point > 0`, {
      event: this.params.event_id
    })

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
