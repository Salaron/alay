import { WV_REQUEST_TYPE, AUTH_LEVEL } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"
import { Utils } from "../../../common/utils"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let html: string
    switch (this.requestData.auth_level) {
      case AUTH_LEVEL.ADMIN: {
        html = await promisify(readFile)(`${rootDir}/webview/admin/index.html`, "UTF-8")
        break
      }
      case AUTH_LEVEL.NONE: {
        html = await promisify(readFile)(`${rootDir}/webview/login/login.html`, "UTF-8")
        let token = Utils.randomString(80 + Math.floor(Math.random() * 10))
        await this.connection.query("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd) VALUES (:token, :expire, :sk, :lk, :lp)", {
          token: token,
          expire: Utils.parseDate(Date.now() + 1200000),
          sk: "",
          lk: "",
          lp: ""
        })
        this.requestData.auth_token = token
        break
      }
      default: {
        this.requestData.resetCookieAuth()
        throw new ErrorUser("Attempt to get access to admin panel", this.user_id)
      }
    }
    let values = {
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      PublicKey: Config.server.PUBLIC_KEY.toString(),
      redirect: "webview.php/admin/index",
      module: "admin",
      currentOnline: await new Utils(this.connection).getCurrentOnline(),
      external: this.requestData.requestFromBrowser,
      user_id: this.user_id,
      token: this.requestData.auth_token,
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      siteKey: Config.modules.login.recaptcha_site_key
    }

    return {
      status: 200,
      result: Handlebars.compile(html)(values)
    }
  }
}