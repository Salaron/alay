import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

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
    const currentEvent = await this.eventStub.getEventById(this.params.event_id)
    if (currentEvent.opened === false) throw new ErrorCode(720)

    return {
      status: 200,
      result: {
        all_user_mission_list: [
          {
            all_user_mission_id: 1,
            all_user_mission_type: 2,
            title_num: 1,
            title: "Хрень какая-то",
            accomplished_value: 1,
            has_played: false,
            goal_list: [
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
          }
        ],
        all_user_mission_total: (await this.connection.first(`SELECT IFNULL((SUM(score_smile) + SUM(score_pure) + SUM(score_cool)), 0) as score FROM event_duty_live_progress WHERE room_id IN ((SELECT room_id FROM event_duty_rooms WHERE event_id = :e_id))`, { e_id: currentEvent.id })).score
      }
    }
  }
}
