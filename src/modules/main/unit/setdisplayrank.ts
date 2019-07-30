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
      unit_owning_user_id: TYPE.INT,
      display_rank: TYPE.INT
    }
  }

  public async execute() {
    let unitData = await this.connection.first("SELECT unit_owning_user_id FROM units WHERE deleted=0 AND user_id=:user AND unit_owning_user_id=:unit", { 
      user: this.user_id, 
      unit: this.params.unit_owning_user_id 
    })
    if (unitData.length == 0) throw new ErrorCode(1311) // ERROR_CODE_UNIT_NOT_EXIST

    await this.connection.query("UPDATE units SET display_rank=:rank WHERE unit_owning_user_id=:unit", { 
      unit: unitData.unit_owning_user_id, 
      rank: this.params.display_rank === 2 ? 2 : 1
    })
    return {
      status: 200,
      result: []
    }
  }
}