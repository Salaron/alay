import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
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
    return {
      mgd: TYPE.INT,
      unit_initial_set_id: TYPE.INT
    }
  }
  public paramCheck() {
    if (![1,2].includes(this.params.mgd)) throw new Error(`Invalid mgd`)
    if (this.params.unit_initial_set_id % 10 < 0 || this.params.unit_initial_set_id % 10 > 9) throw new Error(`Invalid set id`)
    return true
  }

  public async execute() {
    return {
      status: 200,
      result: {}
    }
  }
}