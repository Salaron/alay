import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requiredAuthLevel = AUTH_LEVEL.NONE
  public requestType = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (this.requestData.auth_level < AUTH_LEVEL.ADMIN) {
      // redirect to login
      return {
        status: 302,
        headers: {
          "Location": "../login/login?type=1"
        },
        result: null
      }
    }
    const locals = {
      i18n: await this.i18n.getStrings(),
      pageTitle: "APanel"
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("admin", "index", locals)
    }
  }
}
