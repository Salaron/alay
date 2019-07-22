import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import { Log } from "../../../core/log"

const log = new Log("user/changeName")

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
      name: TYPE.STRING
    }
  }
  public paramCheck() {
    if (!this.formData.name.match(/^.{1,20}$/)) throw new ErrorCode(1100)
    return true
  }

  public async execute() {
    try {
      await this.connection.query("UPDATE users SET name=:name WHERE user_id=:user", {
        name: this.formData.name, 
        user: this.user_id
      })
    } catch (err) {
      log.error(err)
      throw new ErrorCode(1100)
    }
    return {
      status: 200,
      result: {
        before_name: "",
        after_name: this.formData.name
      }
    }
  }
}