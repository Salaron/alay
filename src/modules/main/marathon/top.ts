import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public async paramTypes() {
    return {
      event_id: TYPE.INT
    }
  }

  public async execute() {
    let events = new Events(this.connection)
    let currentEvent = await events.getEventById(this.params.event_id)
    if (!currentEvent.opened) throw new ErrorCode(1234, "Event is closed")

    let eventUser = await events.getEventUserStatus(this.user_id, currentEvent.id)
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