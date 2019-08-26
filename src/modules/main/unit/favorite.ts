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
      favorite_flag: TYPE.INT
    }
  }

  public async execute() {
    let unitData = await this.connection.first("SELECT unit_owning_user_id FROM units WHERE deleted=0 AND user_id=:user AND unit_owning_user_id=:unit", { 
      user: this.user_id, 
      unit: this.params.unit_owning_user_id 
    })
    if (unitData.length == 0) throw new ErrorCode(1311) // ERROR_CODE_UNIT_NOT_EXIST

    await this.connection.query("UPDATE units SET favorite_flag=:fav WHERE unit_owning_user_id=:unit", { 
      unit: this.params.unit_owning_user_id,
      fav: this.params.favorite_flag === 1 ? 1 : 0 // injection save
    })
    return {
      status: 200,
      result: []
    }
  }
}