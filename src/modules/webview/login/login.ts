import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"
import { Utils } from "../../../common/utils"

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

    if (this.params.type === loginType.UPDATE && this.requestData.auth_token.length === 0) {
      const token = Utils.randomString(80 + Math.floor(Math.random() * 10))
      await this.connection.execute("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd) VALUES (:token, DATE_ADD(NOW(), INTERVAL 30 MINUTE), '', '', '')", {
        token
      })
      this.requestData.auth_token = token
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
          `token=${this.requestData.auth_token}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/; SameSite=Strict;`
        ]
      }
    }
  }
}
