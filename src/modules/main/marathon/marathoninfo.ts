import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
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
  public async execute() {
    let currentEvent = await new Events(this.connection).getEventStatus(Events.getEventTypes().TOKEN)
    if (currentEvent.opened === false) return {
      status: 200,
      result: []
    }

    let ranking = await this.connection.first("SELECT event_point, token_point FROM event_ranking WHERE user_id = :user AND event_id = :event", {
      user: this.user_id,
      event: currentEvent.id
    })

    if (!ranking){
      await this.connection.query("INSERT INTO event_ranking (user_id, event_id, event_point) VALUES (:user, :event, 0)", {
        user: this.user_id,
        event: currentEvent.id
      })
      ranking = {
        event_point: 0,
        token_point: 0
      }
    }
    return {
      status: 200,
      result: [
        {
          event_id: currentEvent.id,
          point_name: "Hello",
          point_icon_asset: "assets/flash/ui/live/img/e_icon_01.png",
          event_point: ranking.token_point,
          total_event_point: ranking.event_point,
          event_scenario: {
            progress: 1,
            event_scenario_status: []
          }
        }
      ]
    }
  }
}