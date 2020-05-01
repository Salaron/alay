import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: await this.webview.renderTemplate("tos", "read", {
        pageTitle: "Terms Of Use",
        content: await this.i18n.getMarkdown(this.i18n.markdownType.TOS),
        i18n: await this.i18n.getStrings()
      })
    }
  }
}