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
      throw new ErrorAPI("No permissions")

    const i18n = await this.i18n.getStrings("login-hello")
    const locals = {
      i18n,
      registrationEnabled: Config.modules.login.enable_registration,
      pageTitle: i18n.hello
    }
    const result = await this.webview.renderTemplate("login", "hello", locals)
    return {
      status: 200,
      result
    }
  }
}
