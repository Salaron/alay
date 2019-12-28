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
      room_id: TYPE.INT
    }
  }

  public async execute() {
    let currentEvent = await this.event.getEventStatus(this.event.TYPES.DUTY)
    if (currentEvent.opened === false) throw new ErrorAPI(720)

    let check = await this.connection.first(`SELECT * FROM event_duty_users WHERE user_id = :user AND room_id = :room AND status = 1`, {
      user: this.user_id,
      room: this.params.room_id
    })
    if (!check) throw new ErrorAPI(`User #${this.user_id} not in room #${this.params.room_id}`)

    let room = await this.connection.first(`
    SELECT event_duty_rooms.room_id, live_difficulty_id, mission_id, event_duty_rooms.insert_date, start_flag,
    mission_goal, mission_result, mission_rank, bonus_id,
    (SELECT count(*) FROM event_duty_users WHERE room_id = event_duty_rooms.room_id AND status = 1) as playersNum
    FROM event_duty_rooms WHERE room_id = :room`, { room: this.params.room_id })

    let users: any[] = await this.event.getDutyMatchingUsers(room.room_id, currentEvent.id)

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

    // copy-paste lol
    let bonusIds = room.bonus_id.split(",")
    let bonus = []

    let bonusValue = (await this.connection.first(`SELECT SUM(deck_mic) as mic FROM event_duty_users WHERE room_id = :room AND status = 1`, {
      room: this.params.room_id
    })).mic
    if (bonusIds.length === 2) { // client supports only two bonuses for live
      bonus.push({
        duty_bonus_type: parseInt(bonusIds.shift()),
        event_team_duty_bonus_value: bonusValue
      })
    }
    bonus.push({
      duty_bonus_type: parseInt(bonusIds.shift()),
      event_team_duty_bonus_value: bonusValue
    })

    return {
      status: 200,
      result: {
        event_id: currentEvent.id,
        room_id: this.params.room_id,
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
          mission_value: 1,
          mission_reward: []
        },
        bonus,
        matching_user: users,
        insert_date: room.insert_date
      }
    }
  }
}
