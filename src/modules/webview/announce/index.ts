import moment from "moment"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let [i18n, announceList] = await Promise.all([
      this.i18n.getStrings(this.requestData, "common", "announce-index"),
      this.connection.query(`SELECT * FROM webview_announce ORDER BY insert_date DESC`),
    ])
    this.requestData.requestFromBrowser = false
    announceList = announceList.map((announce: any) => {
      return {
        id: announce.id,
        title: announce.title,
        date: moment(announce.insert_date).format("DD.MM.YYYY H:mm"),
        description: announce.description.replace(/--/g, "—"),
        extendable: announce.body != null
      }
    })

    const values = {
      announceList,
      i18n
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("announce", "index", this.requestData, values)
    }
  }
}
