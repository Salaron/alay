import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
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
    return {}
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let data = await this.connection.first("SELECT partner_unit FROM users WHERE user_id=:user", { user: this.user_id })

    return {
      status: 200,
      result: {
        user: {
          user_id: this.user_id,
          unit_owning_user_id: data.partner_unit
        }
      }
    }
  }
}