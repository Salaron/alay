import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Events } from "../../../common/event"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const currentEvent = await new Events(this.connection).getEventStatus(Events.getEventTypes().DUTY)
    if (currentEvent.opened === false) return {
      status: 200,
      result: []
    }
    // remove user from existing rooms
    await this.connection.query(`UPDATE event_duty_users SET status = 0 WHERE room_id IN (SELECT room_id FROM event_duty_rooms WHERE start_flag = 0 AND user_id = :user)`, {
      user: this.user_id
    })

    let ranking = await this.connection.first("SELECT event_point FROM event_ranking WHERE user_id=:user AND event_id=:event", {
      user: this.user_id,
      event: currentEvent.id
    })

    if (!ranking) {
      await this.connection.query("INSERT INTO event_ranking (user_id, event_id, event_point) VALUES (:user, :event, 0)", {
        user: this.user_id,
        event: currentEvent.id
      })
      ranking = {
        event_point: 0
      }
    }

    const response: any = {
      base_info: {
        event_id: currentEvent.id,
        asset_bgm_id: 201,
        event_point: ranking.event_point,
        total_event_point: ranking.event_point
      },
      difficulty_list: [],
      all_user_mission_count: 0
    }
    for (let i = 1; i <= 6; i++) {
      if (i === 5) continue // technical doesn't support
      response.difficulty_list.push({
        difficulty: i,
        capital_type: 1,
        capital_value: 5
      })
    }

    return {
      status: 200,
      result: response
    }
  }
}
