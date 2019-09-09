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

    let strings = await i18n.getStrings(this.user_id, "common", "login-login", "login-startup", "settings-index")
    let template = await WebView.getTemplate("settings", "index")

    let values = {
      i18n: strings,
      currentOnline: await webview.getCurrentOnline(),
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      changeLanguageModal: await webview.getLanguageModalTemplate(this.user_id),
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      publicKey: Config.server.PUBLIC_KEY
    }

    return {
      status: 200,
      result: template(values)
    }
  }
}