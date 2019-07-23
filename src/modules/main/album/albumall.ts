import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
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
    return { }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let data = await this.connection.query("SELECT * FROM user_unit_album WHERE user_id=:user", { 
      user: this.user_id 
    })
    let albumData = <any>[]
    
    for (let i = 0; i < data.length; i++){
      albumData.push({
        unit_id: data[i].unit_id,
        rank_max_flag: data[i].rank_max_flag === 1,
        love_max_flag: data[i].love_max_flag === 1,
        rank_level_max_flag: data[i].rank_level_max_flag === 1,
        all_max_flag: data[i].all_max_flag === 1,
        highest_love_per_unit: data[i].highest_love_per_unit,
        total_love: data[i].total_love,
        favorite_point: data[i].favorite_point
      })
    }

    return {
      status: 200,
      result: albumData
    }
  }
}