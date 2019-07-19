import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import Handlebars from "handlebars"
import { readFile } from "fs"
import { promisify } from "util"

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
    return {
      id: TYPE.STRING
    }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let values = {
      latestVersion: Config.client.application_version,
      clientVersion: this.requestData.request.headers["bundle-version"] || "N/A"
    }
    let html
    // 11 -- iOS update
    // 12 -- android update
    // 13 -- banned
    switch (this.formData.id) {
      case "11":
      case "12": {
        html = await promisify(readFile)(`${rootDir}/webview/static/update.html`, "UTF-8", )
      }
      case "13": {
        // TODO
      }
    }
    let template = Handlebars.compile(html)
    return {
      status: 200,
      result: template(values)
    }
  }
}