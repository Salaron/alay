import moment from "moment"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

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
    const i18n = await this.i18n.getStrings(this.requestData, "static")
    const language = await this.i18n.getUserLocalizationCode(this.requestData)

    switch (this.params.id) {
      case "10": {
        if (Utils.isUnderMaintenance() === false) return {
          status: 403,
          result: ""
        }
        let template = await WebView.getTemplate("static", "maintenance")
        let values = {
          haveDate: Config.maintenance.notice,
          startTime: moment(Config.maintenance.start_date).format("HH:mm"),
          endTime: moment(Config.maintenance.end_date).format("HH:mm"),
          startDay: moment(Config.maintenance.start_date).format("D MMMM"),
          endDay: moment(Config.maintenance.end_date).format("D MMMM"),
          startTimeEn: moment(Config.maintenance.start_date).locale("en").format("HH:mm"),
          endTimeEn: moment(Config.maintenance.end_date).locale("en").format("HH:mm"),
          startDayEn: moment(Config.maintenance.start_date).locale("en").format("D MMMM"),
          endDayEn: moment(Config.maintenance.end_date).locale("en").format("D MMMM"),
          timeZone: Utils.getTimeZoneWithPrefix(Config.maintenance.time_zone),
          supportMail: Config.mailer.supportMail,
          pageTitle: i18n.maintenance,
          language,
          i18n
        }
        return {
          status: 200,
          result: await this.webview.compileBodyTemplate(template, this.requestData, values)
        }
      }
      case "11":
      case "12": {
        let template = await WebView.getTemplate("static", "update")
        let values = {
          latestVersion: Config.client.application_version,
          clientVersion: this.requestData.request.headers["bundle-version"] || "N/A",
          supportMail: Config.mailer.supportMail,
          pageTitle: i18n.update,
          loggedIn: this.requestData.auth_level > AUTH_LEVEL.PRE_LOGIN,
          download: Config.modules.download,
          language,
          i18n
        }
        return {
          status: 200,
          result: await this.webview.compileBodyTemplate(template, this.requestData, values)
        }
      }
      case "13": {
        const data = await this.connection.first("SELECT * FROM user_banned WHERE user_id = :user", {
          user: this.user_id
        })
        if (!data || this.requestData.auth_level !== AUTH_LEVEL.BANNED) return {
          status: 403,
          result: ""
        }
        let template = await WebView.getTemplate("static", "banned")
        let values = {
          expiration_date: data.expiration_date,
          expiration_date_human: data.expiration_date ? moment.duration(moment().diff(data.expiration_date, "second"), "seconds").humanize() : null,
          message: data.message,
          pageTitle: i18n.banned,
          language
        }
        return {
          status: 200,
          result: await this.webview.compileBodyTemplate(template, this.requestData, values)
        }
      }
      default: return {
        status: 501,
        result: "Not implemented?"
      }
    }
  }
}
