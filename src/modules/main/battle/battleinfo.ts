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
    const currentEvent = await new Events(this.connection).getEventStatus(Events.getEventTypes().BATTLE)
    if (currentEvent.opened === false) return {
      status: 200,
      result: []
    }
    return {
      status: 200,
      result: []
    }
  }
}
