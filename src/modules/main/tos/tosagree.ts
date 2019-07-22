import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
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
    return {
      tos_id: TYPE.INT
    }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    await this.connection.query(`INSERT INTO user_tos (user_id) VALUES (:user)`, { user: this.user_id })
    return {
      status: 200,
      result: {
        tos_id: -1,
        tos_type: 1,
        is_agreed: true,
        server_timestamp: Utils.timeStamp()
      }
    }
  }
}