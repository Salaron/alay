import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE, settingNames } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const [strings, template, mods, userData] = await Promise.all([
      this.i18n.getStrings(this.requestData, "common", "login-login", "login-startup", "settings-index"),
      WebView.getTemplate("settings", "index"),
      this.user.getParams(this.user_id, settingNames),
      this.connection.first("SELECT mail FROM users WHERE user_id = :user", { user: this.user_id })
    ])

    const values = {
      i18n: strings,
      mods,
      userData,
      scripts: [
        "/resources/js/jsencrypt.min.js"
      ]
    }

    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, values)
    }
  }
}
