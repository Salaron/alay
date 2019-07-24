import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
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
      user_id: TYPE.INT
    }
  }

  public async execute() {
    let response: any[] = []
    let rows = await this.connection.query("SELECT unit_id, favorite_point as total_love FROM user_unit_album WHERE user_id=:user ORDER BY total_love DESC", {
      user: this.params.user_id
    })
    for (let i = 0; i < rows.length; i++) {
      response.push({
        unit_id: rows[i].unit_id,
        total_love: rows[i].total_love,
        rank: i + 1
      })
    }

    return {
      status: 200,
      result: response
    }
  }
}