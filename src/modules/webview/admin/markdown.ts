import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"

export default class extends WebViewAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE // yep, free access to markdown!
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: await promisify(readFile)(`${rootDir}/webview/admin/markdown.html`, "UTF-8")
    }
  }
}