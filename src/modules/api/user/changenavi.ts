import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      unit_owning_user_id: TYPE.INT
    }
  }

  public async execute() {
    let check = await this.connection.first("SELECT unit_owning_user_id FROM units WHERE deleted = 0 AND user_id = :user AND unit_owning_user_id = :unit", {
      user: this.user_id,
      unit: this.params.unit_owning_user_id
    })
    if (!check) throw new ErrorAPI(1311)

    await this.connection.query("UPDATE users SET partner_unit = :unit WHERE user_id = :user", {
      user: this.user_id,
      unit: this.params.unit_owning_user_id
    })

    return {
      status: 200,
      result: []
    }
  }
}
