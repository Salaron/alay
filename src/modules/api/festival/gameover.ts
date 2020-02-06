import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const currentEvent = await this.event.getEventStatus(this.event.TYPES.FESTIVAL)
    if (currentEvent.active === false) throw new ErrorAPI(720)

    await this.connection.query("DELETE FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    await this.connection.query("DELETE FROM event_festival_users WHERE user_id = :user", { user: this.user_id })

    const data = await this.event.getEventUserStatus(this.user_id, currentEvent.id)
    const userInfo = await this.user.getUserInfo(this.user_id)
    return {
      status: 200,
      result: {
        event_info: {
          event_id: currentEvent.id,
          event_point_info: {
            before_event_point: data.event_point,
            before_total_event_point: data.event_point,
            after_event_point: data.event_point,
            after_total_event_point: data.event_point,
            base_event_point: 0,
            added_event_point: 0
          },
          event_reward_info: [],
          next_event_reward_info: {
            event_point: 0,
            rewards: []
          }
        },
        after_user_info: userInfo
      }
    }
  }
}
