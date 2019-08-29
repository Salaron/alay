import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"

let i18n: any = {}

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
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