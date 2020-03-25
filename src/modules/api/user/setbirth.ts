import moment from "moment"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      birth_month: TYPE.INT,
      birth_day: TYPE.INT
    }
  }

  public paramCheck() {
    if (
      this.params.birth_day < 1 ||
      this.params.birth_day > moment(this.params.birth_month.toString(), "MM").daysInMonth() ||
      this.params.birth_month < 1 || this.params.birth_month > 12
    ) throw new ErrorAPI("Date is invalid")
  }

  public async execute() {
    if (Config.modules.user.setBirthOnlyOnce) {
      const user = await this.connection.first("SELECT birth_day, birth_month FROM users WHERE user_id = :user", {
        user: this.user_id
      })
      if (user.birth_day !== null || user.birth_month !== null)
        throw new ErrorAPI("Birth date already settled")
    }
    await this.connection.query("UPDATE users SET birth_day = :day, birth_month = :month WHERE user_id = :user", {
      day: this.params.birth_day,
      month: this.params.birth_month,
      user: this.user_id
    })

    const isSameDay = moment(this.params.birth_day, "DD").isSame(Utils.toSpecificTimezone(9), "day")
    const isSameMonth = moment(this.params.birth_month, "MM").isSame(Utils.toSpecificTimezone(9), "month")
    return {
      status: 200,
      result: {
        is_today_birthday: isSameDay && isSameMonth
      }
    }
  }
}
