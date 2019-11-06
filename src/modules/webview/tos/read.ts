import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public async execute() {
    let code = Config.i18n.defaultLanguage
    try {
      code = await this.i18n.getUserLocalizationCode(this.user_id ? this.user_id : <string>this.requestData.auth_token)
    } catch (_) { } // tslint:disable-line

    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(
        await this.webview.getTemplate("tos", "read"),
        this.requestData,
        {
          tos: await this.i18n.getMarkdown(code, this.i18n.markdownType.TOS)
        }
      )
    }
  }
}
