import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { EventStub } from "../../../common/eventstub"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const currentEvent = await new EventStub(this.connection).getEventStatus(EventStub.getEventTypes().BATTLE)
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
