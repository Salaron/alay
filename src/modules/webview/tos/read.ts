import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import showdown from "showdown"
import Handlebars from "handlebars"

const converter = new showdown.Converter({
  tables: true, 
  simpleLineBreaks: true, 
  requireSpaceBeforeHeadingText: true
})

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  private user_id: number | null
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return { }
  }
  public paramCheck() {
    return true
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
      tos: converter.makeHtml(tos.replace(/--/gi, "—"))
    }
    return {
      status: 200,
      result: Handlebars.compile(html)(values)
    }
  }
}