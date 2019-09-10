import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import moment from "moment"
import { TYPE } from "../../../common/type"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
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
        extendable: list[i].body != null
      })
    }

    return {
      status: 200,
      result: response
    }
  }
}