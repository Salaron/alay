import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const data = await this.connection.first("SELECT partner_unit FROM users WHERE user_id=:user", { user: this.user_id })

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
