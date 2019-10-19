import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"

export default class extends ApiAction {
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
      if (typeof this.params.id != "undefined") throw new Error(`Invalid request [form.page][1]`)
      if (!Type.isInt(this.params.page)) throw new Error(`Invalid request [form.page][2]`)

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
      if (typeof this.params.page != "undefined") throw new Error(`Invalid request [form.id][1]`)
      if (!Type.isInt(this.params.id)) throw new Error(`Invalid request [form.id][2]`)

      // find user position at event ranking
      let pos = await this.connection.first(`SELECT FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) as rank FROM event_ranking WHERE user_id=:user AND event_id=:event`, {
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

    let data = await this.connection.query(`
    SELECT
    users.user_id, users.name, users.level,
    unit_id, units.level as unit_level, units.max_level,
    units.rank as unit_rank, units.max_rank as unit_max_rank, units.love, units.max_love, units.unit_skill_level, units.display_rank, units.unit_skill_exp,
    units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool, event_point,
    FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) AS rank,
    (SELECT status FROM user_friend WHERE (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id) AND status = 1 LIMIT 1) as friend_status
    FROM users
    JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    JOIN event_ranking ON event_ranking.user_id = users.user_id AND event_ranking.event_id = :event
    WHERE event_point > 0 HAVING friend_status = 1
    ORDER BY event_point DESC LIMIT ${offset}, ${limit}`, { event: this.params.event_id, user: this.user_id })

    let list = []
    for (let i = 0; i < data.length; i++) {
      let d = data[i]
      list.push({
        rank: i + 1, // local rank
        event_rank: d.rank,
        score: d.event_point,
        user_data: {
          user_id: d.user_id,
          name: d.name,
          level: d.level
        },
        center_unit_info: {
          unit_id: d.unit_id,
          love: d.love,
          level: d.unit_level,
          smile: d.stat_smile,
          cute: d.stat_pure,
          cool: d.stat_cool,
          rank: d.rank,
          display_rank: d.display_rank,
          is_rank_max: d.unit_rank >= d.unit_max_rank,
          is_love_max: d.love >= d.max_love,
          is_level_max: d.unit_level >= d.max_level,
          unit_skill_exp: d.unit_skill_exp,
          unit_removable_skill_capacity: d.removable_skill_capacity,
          removable_skill_ids: []
        },
        setting_award_id: d.setting_award_id
      })
    }
    if (list.length === 0) throw new ErrorCode(1601)

    let count = await this.connection.first(`
    SELECT
      count(event_point) as cnt,
      (SELECT status FROM user_friend WHERE (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id) AND status = 1 LIMIT 1) as friend_status
    FROM event_ranking JOIN users ON event_ranking.user_id = users.user_id
    WHERE event_id = :event AND event_point > 0 GROUP BY friend_status
    HAVING friend_status = 1`, { event: this.params.event_id, user: this.user_id })

    return {
      status: 200,
      result: {
        total_cnt: count.cnt,
        items: list,
        page
      }
    }
  }
}
