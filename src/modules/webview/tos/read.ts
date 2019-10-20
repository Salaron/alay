import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import RequestData from "../../../core/requestData"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public async execute() {
    const i18n = new I18n(this.connection)
    const webview = new WebView(this.connection)

    let code = Config.i18n.defaultLanguage
    try {
      code = await i18n.getUserLocalizationCode(this.user_id ? this.user_id : <string>this.requestData.auth_token)
    } catch (_) { } // tslint:disable-line

    return {
      status: 200,
      result: await webview.compileBodyTemplate(
        await webview.getTemplate("tos", "read"),
        this.requestData,
        {
          tos: await i18n.getMarkdown(code, i18n.markdownType.TOS)
        }
      )
    }
  }
}
