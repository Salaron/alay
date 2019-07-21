import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import moment from "moment"
import Handlebars from "handlebars"

let commonLanguage: any = {}

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
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

    let userLanguage = await utils.getUserLangCode(this.user_id)
    if (Object.keys(commonLanguage).length === 0) commonLanguage = await utils.loadLocalization("announce-index")
    let language = commonLanguage[userLanguage]
    if (Type.isNullDef(language)) throw new Error(`Can't find language settings for code ${userLanguage}`)

    let values = {
      announce: language.announce,
      profile: language.profile,
      settings: language.settings,
      currentOnline: await new Utils(this.connection).getCurrentOnline(),
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      language: JSON.stringify(commonLanguage),
      headers: JSON.stringify(this.requestData.getWebapiHeaders())
    }

    let html = await promisify(readFile)(`${rootDir}/webview/announce/index.html`, "UTF-8")
    return {
      status: 200,
      result: Handlebars.compile(html)(values)
    }
  }
}