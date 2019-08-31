import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"
import { Utils } from "../../../common/utils"

Handlebars.registerHelper("equal", function (a, b, options) {
  // @ts-ignore: Unreachable code error
  if (a == b) { return options.fn(this) }
  // @ts-ignore: Unreachable code error
  return options.inverse(this)
})

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
    let strings = (await utils.loadLocalization("login-hello"))[code]

    let values = {
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      i18n: strings,
      languageList: Config.i18n.supportedLanguages,
      currentLanguage: Config.i18n.langCodes.getKey(code),
      regEnabled: true
    }
    return {
      status: 200,
      result: Handlebars.compile(await promisify(readFile)(`${rootDir}/webview/login/hello.html`, "UTF-8"))(values)
    }
  }
}