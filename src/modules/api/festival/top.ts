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
      event_id: TYPE.INT
    }
  }

  public async execute() {
    const currentEvent = await this.event.getEventById(this.params.event_id)
    if (currentEvent.opened === false) throw new ErrorAPI(720)

    const status = await this.event.getEventUserStatus(this.user_id, currentEvent.id)

    return {
      status: 200,
      result: {
        event_status: {
          total_event_point: status.event_point,
          event_rank: status.event_rank,
          mission_status: {
            level: 1,
            chance_count: 1,
            achievement_type: 1,
            achievement_condition_id_list: [98],
            is_special: false,
            play_count: 0,
            achieved_count: 0,
            achievement_count: 0,
            description: "",
            time_limit: 0,
            result: 0,
            first_clear_bonus: {
              reward_list: [],
              bonus_list: []
            },
            clear_bonus: {
              reward_list: [],
              bonus_list: []
            }
          }
        }
      }
    }
  }
}
