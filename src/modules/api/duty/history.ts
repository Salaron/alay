import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramTypes() {
    return {
      page: TYPE.INT
    }
  }

  public async execute() {
    const event = this.eventStub
    let currentEvent = await this.eventStub.getEventStatus(this.eventStub.TYPES.DUTY)
    if (currentEvent.opened === false) throw new ErrorAPI(720)

    let history = await this.connection.query(`
		SELECT event_duty_rooms.room_id, live_difficulty_id, mission_id, event_duty_rooms.insert_date, start_flag, mission_goal, mission_result, mission_rank,
    (SELECT count(*) FROM event_duty_users WHERE room_id = event_duty_rooms.room_id AND status = 1) as playersNum,
    (SELECT COUNT(*) FROM event_duty_rooms
		JOIN event_duty_users ON event_duty_rooms.room_id = event_duty_users.room_id
		WHERE mission_result IS NOT NULL AND user_id = :user) as total
    FROM event_duty_rooms
		JOIN event_duty_users ON event_duty_rooms.room_id = event_duty_users.room_id
		WHERE mission_result IS NOT NULL AND user_id = :user ORDER BY room_id DESC`, { user: this.user_id })

    let roomList = await Promise.all(history.map(async room => {
      let users: any[] = await event.getDutyMatchingUsers(room.room_id, currentEvent.id)

      users = await Promise.all(users.map(async (user) => {
        let query = `
        SELECT max_combo, (score_smile + score_pure + score_cool) as score, status, mission_value, fc_flag,
        FIND_IN_SET(mission_value, (SELECT GROUP_CONCAT(mission_value ORDER BY mission_value DESC) FROM event_duty_live_progress WHERE room_id=:room)) AS rank
        FROM event_duty_live_progress WHERE room_id = :room AND user_id = :user`
        let userLive = await this.connection.first(query, { room: room.room_id, user: user.user_info.user_id })
        if (!userLive) userLive = []
        user.result = {
          rank: userLive.rank,
          status: 5,
          time_up: userLive.status != 2,
          score: userLive.score,
          max_combo: userLive.max_combo,
          mission_value: userLive.mission_value,
          is_full_combo: !!userLive.fc_flag,
          all_user_mission_type: 1,
          all_user_mission_value: userLive.score
        }
        return user
      }))

      return {
        room_id: room.room_id,
        live_list: [
          {
            live_difficulty_id: room.live_difficulty_id,
            is_random: false
          }
        ],
        mission: {
          mission_type: room.mission_id,
          mission_goal: room.mission_goal * room.playersNum,
          mission_result_value: room.mission_result,
          mission_rank: room.mission_rank,
          mission_value: 1
        },
        matching_user: users,
        insert_date: room.insert_date
      }
    }))

    return {
      status: 200,
      result: {
        page: this.params.page,
        has_next: false,
        room_list: roomList
      }
    }
  }
}
