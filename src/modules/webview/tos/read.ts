import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import showdown from "showdown"
import Handlebars from "handlebars"
import { Utils } from "../../../common/utils"

const converter = new showdown.Converter({
  tables: true, 
  simpleLineBreaks: true, 
  requireSpaceBeforeHeadingText: true
})

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public async execute() {
    const utils = new Utils(this.connection)

    let userLanguage = Config.i18n.defaultLanguage
    if (this.user_id != null) userLanguage = await utils.getUserLangCode(this.user_id)
    let html = await promisify(readFile)(`${rootDir}/webview/tos/read.html`, "UTF-8")
    let tos = ``
    try {
      tos = await promisify(readFile)(`${rootDir}/i18n/TOS/${userLanguage}.md`, "UTF-8")
    } catch (err) {
      tos = await promisify(readFile)(`${rootDir}/i18n/TOS/${Config.i18n.defaultLanguage}.md`, "UTF-8")
      let warningString = await utils.loadLocalization("common")
      tos = `*${warningString[userLanguage].notTranslated}*\n\n${tos}`
    }

    let values = {
      tos: converter.makeHtml(tos.replace(/--/gi, "—")),
      external: this.requestData.requestFromBrowser
    }
    return {
      status: 200,
      result: Handlebars.compile(html)(values)
    }
  }
}