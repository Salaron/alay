import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorCode(1234, "Access only with a certain auth level")

    const [strings, template] = await Promise.all([
      this.i18n.getStrings(<string>this.requestData.auth_token, "login-hello"),
      this.webview.getTemplate("login", "hello")
    ])

    const values = {
      i18n: strings,
      regEnabled: Config.modules.login.enable_registration,
      pageTitle: strings.hello
    }
    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, values)
    }
  }
}
