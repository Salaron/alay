import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"
import { Utils } from "../../../common/utils"

let i18n: any = {}

export default class extends WebViewAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode) throw new ErrorCode(1234, "Access only with a certain auth level")    
    const utils = new Utils(this.connection)

    let code = await utils.getUserLangCode(this.user_id, true, <string>this.requestData.auth_token)
    if (Object.keys(i18n).length === 0) i18n = await utils.loadLocalization("login-startup", "login-login")
    let strings = i18n[code]
    if (Type.isNullDef(strings)) throw new Error(`Can't find language settings for code ${code}`)

    let values = {
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      PublicKey: Config.server.PUBLIC_KEY.toString(),
      external: this.requestData.requestFromBrowser,
      enableRecaptcha: Config.modules.login.enable_recaptcha,
      siteKey: Config.modules.login.recaptcha_site_key,
      i18n: strings
    }
    return {
      status: 200,
      result: Handlebars.compile(await promisify(readFile)(`${rootDir}/webview/login/startup.html`, "UTF-8"))(values)
    }
  }
}