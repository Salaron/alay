import moment from "moment"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const code = await this.i18n.getUserLocalizationCode(this.requestData)
    let [strings, template, announceList] = await Promise.all([
      this.i18n.getStrings(code, "common", "announce-index"),
      WebView.getTemplate("announce", "index"),
      this.connection.query(`SELECT * FROM webview_announce ORDER BY insert_date DESC LIMIT 5`),
    ])

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
      code,
      i18n: strings,
      scripts: [
        "/resources/js/change-language.js"
      ]
    }
    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, values)
    }
  }
}
