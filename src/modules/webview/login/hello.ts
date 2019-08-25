import { AUTH_LEVEL } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"

Handlebars.registerHelper("equal", function (a, b, options) {
  // @ts-ignore: Unreachable code error
  if (a == b) { return options.fn(this) }
  // @ts-ignore: Unreachable code error
  return options.inverse(this)
})

export default class {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  private user_id: number | null
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public async execute() {
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