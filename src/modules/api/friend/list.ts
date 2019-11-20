import moment from "moment"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

const sort: any = {
  1: "users.level ASC",
  2: "users.level DESC",
  3: "units.stat_smile ASC",
  4: "units.stat_smile DESC",
  5: "units.stat_cool ASC",
  6: "units.stat_cool DESC",
  7: "units.stat_pure ASC",
  8: "units.stat_pure DESC",
  9: "last_activity ASC",
  10: "last_activity DESC",
  11: "insert_date ASC",
  12: "insert_date DESC"
}

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      type: TYPE.INT,
      page: TYPE.INT,
      sort: TYPE.INT
    }
  }

  public async execute() {
    const order = sort[this.params.sort]
    if (!order) throw new Error(`Unknown sort type: ${this.params.sort}`)

    let userIds: number[] = []
    switch (this.params.type) {
      case 0: { // friend list
        userIds = (await this.connection.query("SELECT initiator_id, recipient_id FROM user_friend WHERE (initiator_id = :user OR recipient_id = :user) AND STATUS = 1", {
          user: this.user_id
        })).map((friend) => {
          if (friend.initiator_id === this.user_id) return friend.recipient_id
          return friend.initiator_id
        })
        break
      }
      case 1: { // pending
        userIds = (await this.connection.query("SELECT recipient_id FROM user_friend WHERE initiator_id = :user AND status = 0", {
          user: this.user_id
        })).map((pending) => {
          return pending.recipient_id
        })
        break
      }
      case 2: { // approval
        userIds = (await this.connection.query("SELECT initiator_id FROM user_friend WHERE recipient_id = :user AND status = 0", {
          user: this.user_id
        })).map((approval) => {
          return approval.initiator_id
        })
        await this.connection.query(`UPDATE user_friend SET readed = 1 WHERE recipient_id = :user`, { user: this.user_id })
        break
      }
      default: throw new Error(`Invalid type: ${this.params.type}; user_id: ${this.user_id}`)
    }

    if (userIds.length === 0) userIds.push(0)
    let friends = await this.connection.query(`
    SELECT
      users.user_id, name, users.level, introduction, last_login,
      (SELECT last_activity FROM user_login WHERE user_id = users.user_id) as last_activity,
      (SELECT agree_date FROM user_friend WHERE status = 0 AND (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id)) as agree_date,
      (SELECT insert_date FROM user_friend WHERE status = 0 AND (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id)) as insert_date,
      setting_award_id
    FROM
      users
    JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    WHERE partner_unit IS NOT NULL AND users.user_id IN (${userIds.join(",")}) ORDER BY ${order}`, {
      user: this.user_id
    })
    friends = await Promise.all(friends.map(async (friend) => {
      const dateNow = moment(new Date())
      const dateLastLogin = moment(new Date(friend.last_activity || friend.last_login))
      const applied = moment(new Date(friend.agree_date || friend.insert_date))
      const lastLogin = Math.floor(moment.duration(dateNow.diff(dateLastLogin)).asMinutes())
      const appliedTime = Math.floor(moment.duration(dateNow.diff(applied)).asMinutes())

      return {
        user_data: {
          user_id: friend.user_id,
          name: friend.name,
          level: friend.level,
          elapsed_time_from_login: lastLogin > 1440 ? ` ${Math.floor(lastLogin / 1440)} day(s)` : lastLogin > 60 ? ` ${Math.floor(lastLogin / 60)} hour(s)` : ` ${lastLogin} min(s)`,
          elapsed_time_from_applied: appliedTime > 1440 ? ` ${Math.floor(appliedTime / 1440)} day(s)` : appliedTime > 60 ? ` ${Math.floor(appliedTime / 60)} hour(s)` : ` ${appliedTime} min(s)`,
          comment: friend.introduction
        },
        center_unit_info: await this.user.getCenterUnitInfo(friend.user_id),
        setting_award_id: friend.setting_award_id
      }
    }))

    return {
      status: 200,
      result: {
        item_count: friends.length,
        friend_list: friends,
        new_friend_list: [] // should be Array<{user_id: number}> that contains uids, that appear in friend list recently
      }
    }
  }
}
