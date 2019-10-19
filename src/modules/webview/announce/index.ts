import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import RequestData from "../../../core/requestData"
import moment from "moment"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const i18n = new I18n(this.connection)
    const webview = new WebView(this.connection)

    const code = await i18n.getUserLocalizationCode(this.user_id)
    let [strings, template, announceList, changeLanguageModal] = await Promise.all([ // tslint:disable-line
      i18n.getStrings(code, "common", "announce-index"),
      WebView.getTemplate("announce", "index"),
      this.connection.query(`SELECT * FROM webview_announce ORDER BY insert_date DESC LIMIT 5`),
      webview.getLanguageModalTemplate(this.user_id)
    ])

    announceList = announceList.map((announce) => {
      return {
        id: announce.id,
        title: announce.title,
        date: moment(announce.insert_date).format("DD.MM.YYYY H:mm"),
        description: announce.description.replace(/--/g, "—"),
        extendable: announce.body != null
      }
    })

    const values = {
      changeLanguageModal,
      announceList,
      code,
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      i18n: strings
    }
    return {
      status: 200,
      result: template(values)
    }
  }
}
