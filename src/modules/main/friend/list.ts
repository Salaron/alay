import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import moment from "moment"

const sort: any = {
  1: "users.level ASC",
  2: "users.level DESC",
  3: "units.stat_smile ASC",
  4: "units.stat_smile DESC",
  5: "units.stat_cool ASC",
  6: "units.stat_cool DESC",
  7: "units.stat_pure ASC",
  8: "units.stat_pure DESC",
  9: "user_login.last_activity ASC",
  10: "user_login.last_activity DESC",
  11: "user_friend.insert_date ASC",
  12: "user_friend.insert_date DESC"
}

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes() {
    return {
      type: TYPE.INT,
      page: TYPE.INT,
      sort: TYPE.INT
    }
  }

  public async execute() {
    const user = new User(this.connection)

    let order = sort[this.params.sort]
    if (!order) throw new Error(`Unknown sort type: ${this.params.sort}`)
    let whereQuery = ``
    switch (this.params.type) {
      case 0: { // friend list
        whereQuery = `WHERE (initiator_id = :user OR recipient_id = :user) AND status = 1`
        break
      }
      case 1: { // pending
        whereQuery = `WHERE initiator_id = :user AND status = 0`
        break
      }
      case 2: { // approval
        whereQuery = `WHERE recipient_id = :user AND status = 0`
        await this.connection.query(`UPDATE user_friend SET readed = 1 WHERE recipient_id = :user`, { user: this.user_id })
        break
      }
      default: throw new Error(`Invalid type: ${this.params.type}; user_id: ${this.user_id}`)
    }

    let friends = await this.connection.query(`
    SELECT 
      user_friend.insert_date, user_friend.agree_date, user_friend.initiator_id, user_friend.recipient_id
    FROM 
      user_friend
    JOIN users ON user_friend.initiator_id = users.user_id OR user_friend.recipient_id = users.user_id
    JOIN user_unit_deck ON users.user_id = user_unit_deck.user_id AND users.main_deck = user_unit_deck.unit_deck_id 
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id = 5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
    JOIN units ON user_unit_deck_slot.unit_owning_user_id = units.unit_owning_user_id
    JOIN user_login ON users.user_id = user_login.user_id
    ${whereQuery} ORDER BY ${order}`, { user: this.user_id})
    let list: any[] = []

    for (const friend of friends) {
      let friendId = friend.initiator_id
      if (friendId === this.user_id) friendId = friend.recipient_id

      let profile = await this.connection.first(`
      SELECT 
        user_id, name, level, introduction, last_login,
        (SELECT last_activity FROM user_login WHERE user_id = :user) as last_activity,
        setting_award_id
      FROM users 
      WHERE user_id = :user AND tutorial_state = -1`, { user: this.params.invite_code })

      let dateNow = moment(new Date())
      let dateLastLogin = moment(new Date(profile.last_activity || profile.last_login))
      let applied = moment(new Date(friend.agree_date || friend.insert_date))
      let lastLogin = Math.floor(moment.duration(dateNow.diff(dateLastLogin)).asMinutes())
      let appliedTime = Math.floor(moment.duration(dateNow.diff(applied)).asMinutes())

      list.push({
        user_data: {
          user_id: profile.user_id,
          name: profile.name,
          level: profile.level,
          elapsed_time_from_login: lastLogin > 1440 ? ` ${Math.floor(lastLogin/1440)} day(s)` : lastLogin > 60 ? ` ${Math.floor(lastLogin/60)} hour(s)` : ` ${lastLogin} min(s)`,
          elapsed_time_from_applied: appliedTime > 1440 ? ` ${Math.floor(appliedTime/1440)} day(s)` : appliedTime > 60 ? ` ${Math.floor(appliedTime/60)} hour(s)` : ` ${appliedTime} min(s)`,
          comment: profile.introduction
        },
        center_unit_info: await user.getCenterUnitInfo(this.params.invite_code),
        setting_award_id: profile.setting_award_id
      })
    }

    return {
      status: 200,
      result: {
        item_count: list.length,
        friend_list: list
      }
    }
  }
}