import { AUTH_LEVEL } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"

export default class {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE // yep, free access to markdown!

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
    return {
      status: 200,
      result: await promisify(readFile)(`${rootDir}/webview/admin/markdown.html`, "UTF-8")
    }
  }
}