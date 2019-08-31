import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Unit } from "../../../common/unit"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    // TODO: add wait units
    let active = await this.connection.query("SELECT * FROM units WHERE user_id = :user AND deleted = 0", { user: this.user_id })
    return {
      status: 200,
      result: {
        active: active.map((unit: any) => { return Unit.parseUnitData(unit) }),
        waiting: []
      }
    }
  }
}