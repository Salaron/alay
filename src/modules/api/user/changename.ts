import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Logger } from "../../../core/logger"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

const log = new Logger("user/changeName")

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      name: TYPE.STRING
    }
  }

  public paramCheck() {
    if (!this.params.name.match(/^.{1,20}$/)) throw new ErrorAPI(1100)
    return true
  }

  public async execute() {
    try {
      await this.connection.query("UPDATE users SET name=:name WHERE user_id=:user", {
        name: this.params.name,
        user: this.user_id
      })
    } catch (err) {
      log.error(err)
      throw new ErrorAPI(1100)
    }
    return {
      status: 200,
      result: {
        before_name: "",
        after_name: this.params.name
      }
    }
  }
}
