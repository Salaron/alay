import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return { }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let currentEvent = await new Events(this.connection).getEventStatus(Events.getEventTypes().BATTLE)
    if (currentEvent.opened === false) return {
      status: 200,
      responseData: []
    }
    return {
      status: 200,
      result: []
    }
  }
}