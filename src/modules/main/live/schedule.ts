import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

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
    return {}
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let response: any = {
      event_list: [],
      live_list: [],
      limited_bonus_list: [],
      random_live_list: [],
      free_live_list: [],
      training_live_list: []
    }

    let specialLiveList = Live.getSpecialLiveList()
    for (let i = 0; i < specialLiveList.length; i++) {
      response.live_list.push({
        live_difficulty_id: specialLiveList[i],
        start_date: "2018-01-01 00:00:00",
        end_date: "2019-09-01 00:00:00",
        is_random: false
      })
    }

    let events = await this.connection.query("SELECT * FROM events_list WHERE open_date < :now AND close_date > :now", {
      now: new Date(Utils.toSpecificTimezone(9))
    })

    for (let i = 0; i < events.length; i++) {
      let event = events[i]
      response.event_list.push({
        event_id: event.event_id,
        event_category_id: event.event_category_id,
        name: event.name,
        open_date: event.open_date,
        start_date: event.start_date,
        end_date: event.end_date,
        close_date: event.close_date,
        banner_asset_name: event.banner_asset_name,
        banner_se_asset_name: event.banner_se_asset_name,
        result_banner_asset_name: event.result_banner_asset_name,
        description: event.description,
        member_category: event.member_category
      })
    }

    return {
      status: 200,
      result: response
    }
  }
}