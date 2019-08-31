import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, TYPE } from "../../../core/requestData"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      message: TYPE.STRING
    }
  }
  
  public async execute() {
    await this.connection.query(`INSERT INTO error_log (user_id, message, stacktrace) VALUES (:user, :msg, :stack)`, {
      user: this.user_id,
      msg: this.params.message,
      stack: `Url: ${this.params.url}\n\nStack:\n${this.params.stacktrace || null}`
    })

    return {
      status: 200,
      result: true
    }
  }
}