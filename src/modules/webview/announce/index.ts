import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"
import { Utils } from "../../../common/utils"

let i18n: any = {}

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const utils = new Utils(this.connection)

    let code = await utils.getUserLangCode(this.user_id)
    if (Object.keys(i18n).length === 0) i18n = await utils.loadLocalization("announce-index")
    let strings = i18n[code]
    if (Type.isNullDef(strings)) throw new Error(`Can't find language settings for code ${code}`)

    let values = {
      currentOnline: await new Utils(this.connection).getCurrentOnline(),
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      language: JSON.stringify(i18n),
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      i18n: strings
    }

    let html = await promisify(readFile)(`${rootDir}/webview/announce/index.html`, "UTF-8")
    return {
      status: 200,
      result: Handlebars.compile(html)(values)
    }
  }
}