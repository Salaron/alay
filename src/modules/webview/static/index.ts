import moment from "moment"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

enum staticPageType {
  MAINTENANCE = 10,
  IOS_APP_UPDATE = 11,
  ANDROID_APP_UPDATE = 12,
  BANNED_ACCOUNT = 13
}
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
    this.params.id = parseInt(this.params.id)
    if (isNaN(this.params.id)) throw new ErrorAPI("Invalid param")
  }

  public async execute() {
    const languageCode = await this.i18n.getUserLocalizationCode()
    const i18n = await this.i18n.getStrings("static")

    switch (this.params.id) {
      case staticPageType.MAINTENANCE: {
        if (Utils.isUnderMaintenance() === false) throw new ErrorAPI("not now")

        const locals = {
          i18n,
          pageTitle: i18n.maintenance.title,
          startDate: moment(Config.maintenance.start_date).locale(languageCode).format("D MMMM HH:mm"),
          endDate: moment(Config.maintenance.end_date).locale(languageCode).format("D MMMM HH:mm"),
          timezone: Utils.getTimeZoneWithPrefix(Config.maintenance.time_zone),
          supportMail: Config.mailer.supportMail,
        }

        return {
          status: 200,
          result: await this.webview.renderTemplate("static", "maintenance", locals)
        }
      }

      case staticPageType.IOS_APP_UPDATE:
      case staticPageType.ANDROID_APP_UPDATE: {
        const locals = {
          latestVersion: Config.client.application_version,
          clientVersion: this.requestData.request.headers["bundle-version"] || "N/A",
          supportMail: Config.mailer.supportMail,
          pageTitle: i18n.update.title,
          loggedIn: this.requestData.auth_level > AUTH_LEVEL.PRE_LOGIN,
          downloadSources: Config.modules.download.urls,
          i18n
        }
        return {
          status: 200,
          result: await this.webview.renderTemplate("static", "update", locals)
        }
      }

      case staticPageType.BANNED_ACCOUNT: {
        const data = await this.connection.first("SELECT * FROM user_banned WHERE user_id = :user", {
          user: this.user_id
        })
        if (!data) throw new ErrorAPI("you want to be banned?")
        const expirationHumanTime = data.expiration_date ? moment.duration(moment().diff(data.expiration_date, "second"), "seconds").locale(languageCode).humanize() : null
        const expirationDate = moment(data.expiration_date).locale(languageCode).format("LLL")
        // TODO: do this directly in i18n?
        i18n.banned.temporaryBanned = Utils.prepareTemplate(i18n.banned.temporaryBanned, {
          time: `${expirationHumanTime} (${expirationDate})`
        })
        const locals = {
          permanent: data.expiration_date === null,
          message: data.message,
          supportMail: Config.mailer.supportMail,
          pageTitle: i18n.banned.title,
          i18n
        }
        return {
          status: 200,
          result: await this.webview.renderTemplate("static", "banned", locals)
        }
      }
      default: throw new ErrorAPI("Invalid param")
    }
  }
}