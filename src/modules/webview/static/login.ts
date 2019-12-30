import { Utils } from "../../../common/utils"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const strings = await this.i18n.getStrings(Config.i18n.defaultLanguage, "login-login", "login-startup")

    const values = {
      redirect: "webview.php/static/index?id=12",
      module: "static",
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      siteKey: Config.modules.login.recaptcha_site_key,
      i18n: strings,
      scripts: [
        "/resources/js/jsencrypt.min.js",
      ]
    }

    switch (this.requestData.auth_level) {
      case AUTH_LEVEL.PRE_LOGIN:
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
        if (Config.modules.login.enable_recaptcha) {
          values.scripts.push(`https://www.google.com/recaptcha/api.js?render=${Config.modules.login.recaptcha_site_key}`)
        }
        return {
          status: 200,
          result: await this.webview.compileBodyTemplate(template, this.requestData, values)
        }
      }
      default: {
        return {
          status: 403,
          result: ""
        }
      }
    }
  }
}
