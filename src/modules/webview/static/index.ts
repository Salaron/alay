import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import moment from "moment"
import Handlebars from "handlebars"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

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
      haveDate: Config.maintenance.notice,
      startTime: moment(Config.maintenance.start_date).format("HH:mm"),
      endTime: moment(Config.maintenance.end_date).format("HH:mm"),
      startDay: moment(Config.maintenance.start_date).format("D MMMM"),
      endDay: moment(Config.maintenance.start_date).format("D MMMM"),
      timeZone: Config.maintenance.time_zone,
      latestVersion: Config.client.application_version,
      clientVersion: this.requestData.request.headers["bundle-version"] || "N/A"
    }
    // 10 -- maintenance (custom)
    // 11 -- iOS update
    // 12 -- android update
    // 13 -- banned
    let html
    switch (this.params.id) {
      case "10": html = await promisify(readFile)(`${rootDir}/webview/static/maintenance.html`, "UTF-8"); break
      case "11":
      case "12": html = await promisify(readFile)(`${rootDir}/webview/static/update.html`, "UTF-8"); break
      case "13": {
        // TODO
      }
    }
    return {
      status: 200,
      result: Handlebars.compile(html)(values)
    }
  }
}