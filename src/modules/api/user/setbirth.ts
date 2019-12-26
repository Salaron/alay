import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import moment from "moment"
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
    ) throw new ErrorAPI("date is invalid")
  }

  public async execute() {
    if (Config.modules.user.setBirthOnlyOnce) {
      let date = await this.connection.first("SELECT birth_day, birth_month FROM users WHERE user_id = :user", {
        user: this.user_id
      })
      if (date.birth_day != null || date.birth_month != null) throw new ErrorAPI(`date of birth is already set and it can not be changed`)
    }

    await this.connection.query("UPDATE users SET birth_day=:day, birth_month=:month WHERE user_id=:user", {
      day: this.params.birth_day,
      month: this.params.birth_month,
      user: this.user_id
    })

    return {
      status: 200,
      result: {
        is_today_birthday: moment(this.params.birth_day, "DD").isSame(Date.now(), "day") && moment(this.params.birth_month, "MM").isSame(Date.now(), "month")
      }
    }
  }
}
