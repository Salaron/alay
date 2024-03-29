import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends WebViewAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI("Access only with a certain auth level")

    const [strings, template] = await Promise.all([
      this.i18n.getStrings(this.requestData, "login-startup", "login-login"),
      this.webview.getTemplate("login", "login")
    ])

    const values = {
      module: "login",
      scripts: [
        "/resources/js/jsencrypt.min.js",
      ],
      siteKey: Config.modules.login.recaptcha_site_key,
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      i18n: strings,
      pageTitle: "SunLight Login"
    }

    if (Config.modules.login.enable_recaptcha) {
      values.scripts.push(`https://www.google.com/recaptcha/api.js?render=${Config.modules.login.recaptcha_site_key}`)
    }
    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, values)
    }
  }
}
