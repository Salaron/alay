import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
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

    let [strings, template, currentOnline, changeLanguageModal] = await Promise.all([
      i18n.getStrings(this.user_id, "common", "announce-index"),
      WebView.getTemplate("announce", "index"),
      webview.getCurrentOnline(),
      webview.getLanguageModalTemplate(this.user_id)
    ])

    let values = {
      currentOnline,
      changeLanguageModal,
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