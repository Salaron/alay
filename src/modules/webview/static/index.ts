import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { readFile } from "fs"
import { promisify } from "util"
import moment from "moment"
import Handlebars from "handlebars"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
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
    // 10 -- maintenance (custom)
    // 11 -- iOS update
    // 12 -- android update
    // 13 -- banned
    let html = ""
    let values = {}
    switch (this.params.id) {
      case "10": {
        if (Utils.isUnderMaintenance() === false)
          throw new Error(`Server is not under maintenance`)
        html = await promisify(readFile)(`${rootDir}/webview/static/maintenance.html`, "UTF-8")
        values = {
          haveDate: Config.maintenance.notice,
          startTime: moment(Config.maintenance.start_date).format("HH:mm"),
          endTime: moment(Config.maintenance.end_date).format("HH:mm"),
          startDay: moment(Config.maintenance.start_date).format("D MMMM"),
          endDay: moment(Config.maintenance.end_date).format("D MMMM"),
          startTimeEn: moment(Config.maintenance.start_date).locale("en").format("HH:mm"),
          endTimeEn: moment(Config.maintenance.end_date).locale("en").format("HH:mm"),
          startDayEn: moment(Config.maintenance.start_date).locale("en").format("D MMMM"),
          endDayEn: moment(Config.maintenance.end_date).locale("en").format("D MMMM"),
          timeZone: Utils.getTimeZoneWithPrefix(Config.maintenance.time_zone)
        }
        break
      }
      case "11":
      case "12": {
        html = await promisify(readFile)(`${rootDir}/webview/static/update.html`, "UTF-8")
        values = {
          latestVersion: Config.client.application_version,
          clientVersion: this.requestData.request.headers["bundle-version"] || "N/A"
        }
        break
      }
      case "13": {
        if (this.requiredAuthLevel <= AUTH_LEVEL.UPDATE)
          throw new Error(`No permissions`)
        let data = await this.connection.first("SELECT * FROM user_banned WHERE user_id = :user", {
          user: this.user_id
        })
        if (!data) return {
          status: 403,
          result: ""
        }
        html = await promisify(readFile)(`${rootDir}/webview/static/banned.html`, "UTF-8")
        values = {
          expiration_date: data.expiration_date,
          expiration_date_human: data.expiration_date ? moment.duration(moment().diff(data.expiration_date, "second"), "seconds").humanize() : null,
          message: data.message
        }
        break
      }
      default: return {
        status: 501,
        result: "Not implemented yet."
      }
    }
    return {
      status: 200,
      result: <string>Handlebars.compile(html)(values)
    }
  }
}