import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import Handlebars from "handlebars"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.ADMIN

  constructor(requestData: RequestData) {
    super(requestData)
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