import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends WebViewAction {
  public requiredAuthLevel = AUTH_LEVEL.PRE_LOGIN
  public requestType = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (this.requestData.auth_level !== this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI("No permissions")
    if (!Config.modules.login.enable_registration) throw new ErrorAPI("Registration disabled")

    const i18n = await this.i18n.getStrings(this.requestData, "login-startup", "login-login")
    const locals = {
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      siteKey: Config.modules.login.recaptcha_site_key,
      publicKey: JSON.stringify(Config.server.PUBLIC_KEY),
      i18n,
      pageTitle: "SunLight Registration"
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("login", "startup", locals)
    }
  }
}
