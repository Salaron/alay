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

    let [strings, template, changeLanguageModal] = await Promise.all([
      i18n.getStrings(this.user_id, "login-hello"),
      WebView.getTemplate("login", "hello"),
      await new WebView(this.connection).getLanguageModalTemplate(this.user_id)
    ])

    let values = {
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      i18n: strings,
      changeLanguageModal,
      regEnabled: Config.modules.login.enable_registration
    }
    return {
      status: 200,
      result: template(values)
    }
  }
}