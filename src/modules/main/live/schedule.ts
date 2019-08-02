import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

const marathonDB = sqlite3.getMarathon()

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

  public async execute() {
    let response: any = {
      event_list: [],
      live_list: [],
      limited_bonus_list: [],
      random_live_list: [], // TODO
      free_live_list: [],
      training_live_list: []
    }

    if (Config.modules.live.unlockAll) {
      let specialLiveList = Live.getSpecialLiveList()
      for (const live of specialLiveList) {
        response.live_list.push({
          live_difficulty_id: live,
          start_date: "2018-01-01 00:00:00",
          end_date: "2019-09-01 00:00:00",
          is_random: false
        })
      }
    }
    
    let events = await this.connection.query("SELECT * FROM events_list WHERE open_date <= :now AND close_date > :now", {
      now: Utils.toSpecificTimezone(9)
    })

    for (const event of events) {
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

    let marathonEvent = await new Events(this.connection).getEventStatus(Events.getEventTypes().TOKEN)
    if (marathonEvent.active) {
      let marathonLives = (await marathonDB.all("SELECT live_difficulty_id FROM event_marathon_live_schedule_m WHERE event_id = :id", {
        id: marathonEvent.id
      })).map(live => live.live_difficulty_id)
      for (const live of marathonLives) {
        response.live_list.push({
          live_difficulty_id: live,
          start_date: marathonEvent.open_date,
          end_date: marathonEvent.close_date,
          is_random: false
        })
      }
    }
    return {
      status: 200,
      result: response
    }
  }
}