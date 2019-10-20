import { WV_REQUEST_TYPE, AUTH_LEVEL } from "../../../models/constant"
import RequestData from "../../../core/requestData"
import { Utils } from "../../../common/utils"
import { WebView } from "../../../common/webview"
import { I18n } from "../../../common/i18n"
import { webview } from "../../../common"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const webview = new WebView(this.connection)

    const strings = await new I18n(this.connection).getStrings(Config.i18n.defaultLanguage, "login-login", "login-startup")

    const values = {
      redirect: "webview.php/admin/index",
      module: "admin",
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      siteKey: Config.modules.login.recaptcha_site_key,
      i18n: strings
    }

    switch (this.requestData.auth_level) {
      case AUTH_LEVEL.ADMIN: {
        let template = await WebView.getTemplate("admin", "index")
        return {
          status: 200,
          result: await webview.compileBodyTemplate(template, this.requestData, values)
        }
      }
      case AUTH_LEVEL.NONE: {
        let template = await WebView.getTemplate("login", "login")

        const token = Utils.randomString(80 + Math.floor(Math.random() * 10))
        await this.connection.query("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd) VALUES (:token, :expire, :sk, :lk, :lp)", {
          token,
          expire: Utils.parseDate(Date.now() + 1200000),
          sk: "",
          lk: "",
          lp: ""
        })
        this.requestData.auth_token = token
        return {
          status: 200,
          result: template(values)
        }
      }
      default: {
        this.requestData.resetCookieAuth()
        throw new ErrorUser("Attempt to get access to admin panel", this.user_id)
      }
    }
  }
}
