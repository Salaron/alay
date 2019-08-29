import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import moment from "moment"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
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
    return {
      offset: TYPE.INT
    }
  }

  public async execute() {
    let response: any = {
      announceList: [],
      total: (await this.connection.first(`SELECT COUNT(*) as cnt FROM webview_announce`)).cnt
    }
    let list = await this.connection.query(`SELECT * FROM webview_announce ORDER BY insert_date DESC LIMIT ${this.params.offset}, 30`)
    for (let i = 0; i < list.length; i++) {
      response.announceList.push({
        id: list[i].id,
        title: list[i].title,
        date: moment(list[i].insert_date).format("HH:mm DD-MM-YYYY"),
        description: list[i].description.replace(/--/g, "—"),
        extendable: list[i].announce != null
      })
    }

    return {
      status: 200,
      result: response
    }
  }
}