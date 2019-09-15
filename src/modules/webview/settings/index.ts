import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"
import { User } from "../../../common/user"

export const supportedMods = ["event", "hp", "mirror", "vanish"]
export const supportedModsValues = <any>{
  event: 1,
  hp: 2,
  mirror: 1,
  vanish: 2
}

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const i18n = new I18n(this.connection)
    const webview = new WebView(this.connection)

    const [strings, template, mods, userData, changeLanguageModal] = await Promise.all([
      i18n.getStrings(this.user_id, "common", "login-login", "login-startup", "settings-index"),
      WebView.getTemplate("settings", "index"),
      new User(this.connection).getParams(this.user_id, supportedMods),
      this.connection.first("SELECT mail FROM users WHERE user_id = :user", { user: this.user_id }),
      webview.getLanguageModalTemplate(this.user_id)
    ])

    const values = {
      i18n: strings,
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      publicKey: Config.server.PUBLIC_KEY,
      mods,
      userData,
      changeLanguageModal
    }

    return {
      status: 200,
      result: template(values)
    }
  }
}
