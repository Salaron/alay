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
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return {}
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let response = {
      item_count: 0,
      marquee_list: <any>[]
    }
    if (Config.maintenance.notice) {
      response.marquee_list.push({
        marquee_id: -1,
        text: `TODO`,
        text_color: 0,
        start_date: Utils.toSpecificTimezone(Config.maintenance.time_zone, Config.maintenance.start_date),
        end_date: Utils.toSpecificTimezone(Config.maintenance.time_zone, Config.maintenance.start_date)
      })
      response.item_count += 1
    }

    return {
      status: 200,
      result: response
    }
  }
}