import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Events } from "../../../common/event"
import { TYPE } from "../../../common/type"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async paramTypes() {
    return {
      event_id: TYPE.INT
    }
  }

  public async execute() {
    const events = new Events(this.connection)
    const currentEvent = await events.getEventById(this.params.event_id)
    if (!currentEvent.opened) throw new ErrorCode(1234, "Event is closed")

    const eventUser = await events.getEventUserStatus(this.user_id, currentEvent.id)
    return {
      status: 200,
      result: {
        event_status: {
          total_event_point: eventUser.event_point,
          event_rank: eventUser.event_rank
        }
      }
    }
  }
}
