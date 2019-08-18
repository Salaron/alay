import { AUTH_LEVEL } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"

export default class {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.ADMIN

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
    let values = {
      headers: JSON.stringify(this.requestData.getWebapiHeaders())
    }
    return {
      status: 200,
      result: Handlebars.compile(await promisify(readFile)(`${rootDir}/webview/admin/log.html`, "UTF-8"))(values)
    }
  }
}