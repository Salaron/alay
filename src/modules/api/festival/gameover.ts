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

    const [eventInfo, userInfo] = await Promise.all([
      this.event.eventInfoWithRewards(this.user_id, currentEvent, 0, 0),
      this.user.getUserInfo(this.user_id),
      this.connection.query("DELETE FROM user_live_progress WHERE user_id = :user", { user: this.user_id }),
      this.connection.query("DELETE FROM event_festival_users WHERE user_id = :user", { user: this.user_id })
    ])
    return {
      status: 200,
      result: {
        event_info: {
          event_id: currentEvent.id,
          event_point_info: {
            ...eventInfo.event_point_info,
            score_bonus: 1,
            combo_bonus: 1,
            item_bonus: 1,
            guest_bonus: 1,
            mission_bonus: 1
          },
          event_reward_info: eventInfo.event_reward_info,
          next_event_reward_info: eventInfo.next_event_reward_info,
          event_mission_reward_info: [],
          event_mission_bonus_reward_info: [],
          event_notice: []
        },
        after_user_info: userInfo
      }
    }
  }
}
