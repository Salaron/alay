import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramTypes() {
    return {
      user_id: TYPE.INT,
      event_id: TYPE.INT
    }
  }

  public async execute() {
    let event = await this.event.getEventById(this.params.event_id)
    if (event.opened === false) throw new ErrorAPI(10004) // ERROR_CODE_EVENT_NO_EVENT_DATA

    // check if this user have ranking records
    let rankingData = await this.connection.first(`SELECT * FROM event_ranking WHERE user_id = :user AND event_id = :event`, {
      user: this.params.user_id,
      event: this.params.event_id
    })
    if (rankingData.length === 0 || Type.isNullDef(rankingData.deck)) throw new ErrorAPI(10003) // ERROR_CODE_EVENT_NO_EVENT_POINT_USER_DATA

    let deck = JSON.parse(rankingData.deck)
    let liveList = []
    for (let i = 0; i < deck.live_list.length; i++) { // tslint:disable-line
      liveList.push({
        live_info: deck.live_list[i],
        deck_info: {
          live_difficulty_id: deck.live_list[i].live_difficulty_id,
          total_status: deck.deck.total_status,
          center_bonus: deck.deck.center_bonus,
          si_bonus: deck.deck.si_bonus,
          unit_list: deck.deck.units
        }
      })
    }

    return {
      status: 200,
      result: {
        live_list: liveList,
        score_info: deck.score_info
      }
    }
  }
}
