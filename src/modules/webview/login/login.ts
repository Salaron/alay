import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"
import { Utils } from "../../../common/utils"
import { AuthToken } from "../../../models/authToken"

export enum loginType {
  UPDATE,
  ADMIN
}

export default class extends WebViewAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramCheck() {
    if (this.params.type) this.params.type = parseInt(this.params.type)
  }

  public async execute() {
    if (!Type.isInt(this.params.type) && this.requestData.auth_level !== AUTH_LEVEL.PRE_LOGIN)
      throw new ErrorAPI("No permissions")

    if (Type.isInt(this.params.type) && this.requestData.auth_token.length === 0) {

      const authToken = new AuthToken(Utils.randomString(80 + Math.floor(Math.random() * 10)))
      await authToken.save()
      this.requestData.auth_token = authToken.token
    }
    const i18n = await this.i18n.getStrings(this.requestData, "login-startup", "login-login")

    const locals = {
      module: "login",
      siteKey: Config.modules.login.recaptcha_site_key,
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      i18n,
      pageTitle: "Login"
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("login", "login", locals),
      headers: {
        "Set-Cookie": [
          Utils.getCookieHeader("token", this.requestData.auth_token, 23)
        ]
      }
    }
  }
}
