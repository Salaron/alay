import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      cancel: TYPE.BOOLEAN
    }
  }

  public async execute() {
    if (this.params.cancel === true) {
      await this.connection.execute("DELETE FROM user_live_progress WHERE user_id = :user", {
        user: this.user_id
      })
      await this.connection.execute("DELETE FROM user_class_live_progress WHERE user_id = :user", {
        user: this.user_id
      })
      await this.connection.execute("DELETE FROM event_festival_users WHERE user_id = :user", {
        user: this.user_id
      })
      await this.connection.execute("DELETE FROM user_live_random WHERE user_id = :user AND in_progress = 1", {
        user: this.user_id
      })
    }

    return {
      status: 200,
      result: []
    }
  }
}
