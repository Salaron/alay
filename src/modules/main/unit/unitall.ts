import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes() {
    return {}
  }
  public paramCheck() {
    return true
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