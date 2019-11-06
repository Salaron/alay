import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    // TODO: add wait units
    const active = await this.connection.query("SELECT * FROM units WHERE user_id = :user AND deleted = 0", { user: this.user_id })
    return {
      status: 200,
      result: {
        active: active.map((unit: any) => this.unit.parseUnitData(unit)),
        waiting: []
      }
    }
  }
}
