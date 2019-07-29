import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"
import moment from "moment"

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
    let response = {
      item_count: 0,
      marquee_list: <any>[]
    }
    if (Config.maintenance.notice && moment(Config.maintenance.start_date).diff(moment(new Date()).utcOffset(Config.maintenance.time_zone), "h") < 3) {
      let startDay = moment(Config.maintenance.start_date).format("D MMMM")
      let startTime = moment(Config.maintenance.start_date).format("HH:mm")
      let endDay = moment(Config.maintenance.end_date).format("D MMMM")
      let endTime = moment(Config.maintenance.end_date).format("HH:mm")
      response.marquee_list.push({
        marquee_id: 1,
        text: `В период с ${startDay} ${startTime} по ${endDay} ${endTime} UTC+${Config.maintenance.time_zone} сервер будет отключён для проведения обновления`,
        start_date: Utils.toSpecificTimezone(9, new Date(new Date().setMinutes(new Date().getMinutes() - 1))),
        end_date: Utils.toSpecificTimezone(9, Config.maintenance.start_date)
      })
      response.item_count += 1
    }

    return {
      status: 200,
      result: response
    }
  }
}