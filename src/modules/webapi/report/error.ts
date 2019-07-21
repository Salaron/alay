import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  private user_id: number | null
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return {
      message: TYPE.STRING
    }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    await this.connection.query(`INSERT INTO error_log (user_id, message, stacktrace) VALUES (:user, :msg, :stack)`, {
      user: this.user_id,
      msg: this.formData.message,
      stack: `Url: ${this.formData.url}\n\nStack:\n${this.formData.stacktrace || null}`
    })

    return {
      status: 200,
      result: true
    }
  }
}