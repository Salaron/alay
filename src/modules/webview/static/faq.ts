import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    // TODO
    return {
      status: 200,
      result: await this.webview.renderTemplate("common", "notready", {
        pageTitle: "Profile",
        i18n: await this.i18n.getStrings()
      })
    }
  }
}