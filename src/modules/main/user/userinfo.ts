import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { User } from "../../../common/user"
import { Utils } from "../../../common/utils"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
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