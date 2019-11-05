import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { EventStub } from "../../../common/eventstub"
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
      event_id: TYPE.INT
    }
  }

  public async execute() {
    const events = new EventStub(this.connection)

    const currentEvent = await events.getEventById(this.params.event_id)
    if (currentEvent.opened === false) throw new ErrorCode(720)

    // remove user from existing rooms
    await this.connection.query(`UPDATE event_duty_users SET status = 0 WHERE room_id IN (SELECT room_id FROM event_duty_rooms WHERE start_flag = 0 AND user_id = :user)`, {
      user: this.user_id
    })
    await this.connection.query(`UPDATE event_duty_live_progress SET status = 0 WHERE status = 1 AND user_id = :user`, { user: this.user_id })
    const status = await events.getEventUserStatus(this.user_id, this.params.event_id)
    const history = await this.connection.query(`
		SELECT mission_result FROM event_duty_rooms
		JOIN event_duty_users ON event_duty_rooms.room_id = event_duty_users.room_id
		WHERE mission_result IS NOT NULL AND user_id = :user`, { user: this.user_id })

    const response = {
      event_status: {
        total_event_point: status.event_point,
        event_rank: status.event_rank
      },
      all_user_mission: {
        all_user_mission_id: 1,
        all_user_mission_type: 2,
        title_num: 1,
        title: "Хрень какая-то",
        accomplished_value: 1,
        has_played: false,
        goal_list: [ // one goal is needed
          {
            goal_value: 1,
            achieved: true,
            reward: {
              item_id: 4,
              add_type: 3001,
              amount: 1,
              item_category_id: 4
            },
            now_achieved: true
          }
        ]
      },
      all_user_mission_total: (await this.connection.first(`SELECT IFNULL((SUM(score_smile) + SUM(score_pure) + SUM(score_cool)), 0) as score FROM event_duty_live_progress WHERE room_id IN ((SELECT room_id FROM event_duty_rooms WHERE event_id = :e_id))`, { e_id: currentEvent.id })).score,
      has_history: history.length > 0
    }

    return {
      status: 200,
      result: response
    }
  }
}
