import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const template = await WebView.getTemplate("server", "donation")
    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData)
    }
  }
}
