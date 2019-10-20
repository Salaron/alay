import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const userAlbum = await this.connection.query("SELECT * FROM user_unit_album WHERE user_id=:user", {
      user: this.user_id
    })
    const albumData = <any>[]

    for (const data of userAlbum) {
      albumData.push({
        unit_id: data.unit_id,
        rank_max_flag: data.rank_max_flag === 1,
        love_max_flag: data.love_max_flag === 1,
        rank_level_max_flag: data.rank_level_max_flag === 1,
        all_max_flag: data.all_max_flag === 1,
        highest_love_per_unit: data.highest_love_per_unit,
        total_love: data.total_love,
        favorite_point: data.favorite_point
      })
    }

    return {
      status: 200,
      result: albumData
    }
  }
}
