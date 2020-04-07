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
    const userAlbum = await this.connection.query("SELECT * FROM user_unit_album WHERE user_id = :user", {
      user: this.user_id
    })

    const result = userAlbum.map(cardData => {
      return {
        unit_id: cardData.unit_id,
        rank_max_flag: cardData.rank_max_flag === 1,
        love_max_flag: cardData.love_max_flag === 1,
        rank_level_max_flag: cardData.rank_level_max_flag === 1,
        all_max_flag: cardData.all_max_flag === 1,
        highest_love_per_unit: cardData.highest_love_per_unit,
        total_love: cardData.total_love,
        favorite_point: cardData.favorite_point,
        sign_flag: this.unit.isSignUnit(cardData.unit_id)
      }
    })

    return {
      status: 200,
      result
    }
  }
}
