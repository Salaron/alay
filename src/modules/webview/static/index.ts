import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import moment from "moment"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"
import { WebView } from "../../../common/webview"

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

  public async execute() {
    // 10 -- maintenance (custom)
    // 11 -- iOS update
    // 12 -- android update
    // 13 -- banned
    let template
    let values = {}
    switch (this.params.id) {
      case "10": {
        if (Utils.isUnderMaintenance() === false) return {
          status: 403,
          result: ""
        }
        template = await WebView.getTemplate("static", "maintenance")
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
        template = await WebView.getTemplate("static", "update")
        values = {
          latestVersion: Config.client.application_version,
          clientVersion: this.requestData.request.headers["bundle-version"] || "N/A"
        }
        break
      }
      case "13": {
        const data = await this.connection.first("SELECT * FROM user_banned WHERE user_id = :user", {
          user: this.user_id
        })
        if (!data || this.requestData.auth_level !== AUTH_LEVEL.BANNED) return {
          status: 403,
          result: ""
        }
        template = await WebView.getTemplate("static", "banned")
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
      result: template(values)
    }
  }
}
