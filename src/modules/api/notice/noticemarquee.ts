import moment from "moment"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const langCode = await this.i18n.getUserLocalizationCode(this.requestData)
    const strings = await this.i18n.getStrings(langCode, "noticemarquee")

    const response = {
      item_count: 0,
      marquee_list: <any>[]
    }
    if (Config.maintenance.notice && moment(Config.maintenance.start_date).diff(moment(new Date()).utcOffset(Config.maintenance.time_zone), "h") < 3) {
      const startDay = moment(Config.maintenance.start_date).locale(langCode).format("D MMMM")
      const startTime = moment(Config.maintenance.start_date).locale(langCode).format("HH:mm")
      const endDay = moment(Config.maintenance.end_date).locale(langCode).format("D MMMM")
      const endTime = moment(Config.maintenance.end_date).locale(langCode).format("HH:mm")
      response.marquee_list.push({
        marquee_id: 1,
        text: Utils.prepareTemplate(strings.maintenanceNotice, {
          startDay,
          startTime,
          endDay,
          endTime,
          timeZone: Utils.getTimeZoneWithPrefix(Config.maintenance.time_zone)
        }),
        start_date: Utils.toSpecificTimezone(9, new Date(new Date().setMinutes(new Date().getMinutes() - 1))),
        end_date: Utils.toSpecificTimezone(9, Config.maintenance.start_date)
      })
      response.item_count += 1
    }

    return {
      status: 200,
      result: response
    }
  }
}
