import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requiredAuthLevel = AUTH_LEVEL.ADMIN
  public requestType = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const locals = {
      i18n: this.i18n.getStrings(this.requestData, "common"),
      pageTitle: "New Secretbox"
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("admin", "secretbox", locals)
    }
  }
}
