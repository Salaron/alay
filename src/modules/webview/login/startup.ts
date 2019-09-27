import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"

export default class extends WebViewAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorCode(1234, "Access only with a certain auth level")
    const i18n = new I18n(this.connection)

    const [strings, template] = await Promise.all([
      i18n.getStrings(<string>this.requestData.auth_token, "login-startup", "login-login"),
      WebView.getTemplate("login", "startup")
    ])

    const values = {
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      publicKey: JSON.stringify(Config.server.PUBLIC_KEY),
      external: this.requestData.requestFromBrowser,
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      siteKey: Config.modules.login.recaptcha_site_key,
      i18n: strings
    }
    return {
      status: 200,
      result: template(values)
    }
  }
}
