import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    await this.connection.execute("DELETE FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    await this.connection.execute("DELETE FROM user_live_random WHERE user_id = :user AND token = :token", {
      token: this.params.token,
      user: this.user_id
    })
    return {
      status: 200,
      result: []
    }
  }
}
