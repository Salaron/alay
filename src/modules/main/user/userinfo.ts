import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
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

  public paramTypes() {
    return { }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let birth = await this.connection.first("SELECT birth_day, birth_month FROM users WHERE user_id = :user", {
      user: this.user_id
    })
    let response: any = {
      user: await new User(this.connection).getUserInfo(this.user_id),
      server_timestamp: Utils.timeStamp()
    }
    if (birth.birth_month != null && birth.birth_day != null) response.birth = {
      birth_month: birth.birth_month,
      birth_day: birth.birth_day
    }

    return {
      status: 200,
      result: response
    }
  }
}