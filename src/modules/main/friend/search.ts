import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import moment from "moment"
import { User } from "../../../common/user"
import { TYPE } from "../../../common/type"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      invite_code: TYPE.STRING
    }
  }

  public async execute() {
    const numbers = this.params.invite_code.match(/\d+/g)
    if (numbers === null) throw new ErrorCode(2400, "Invite_code doesn't contain numbers")
    this.params.invite_code = numbers[0]
    const user = new User(this.connection)

    const profile = await this.connection.first(`
    SELECT
      user_id, name, level, unit_max, energy_max, friend_max, introduction, last_login,
      (SELECT count(*) FROM units WHERE unit_owning_user_id=:user AND deleted=0) as unit_cnt,
      (SELECT last_activity FROM user_login WHERE user_id = :user) as last_activity,
      setting_award_id, setting_background_id
    FROM users
    WHERE user_id = :user AND tutorial_state = -1`, { user: this.params.invite_code })
    if (!profile) throw new ErrorCode(2400, "User not found")

    try {
      const dateNow = moment(new Date())
      const dateLastLogin = moment(new Date(profile.last_activity || profile.last_login))
      const lastLogin = Math.floor(moment.duration(dateNow.diff(dateLastLogin)).asMinutes())

      const response = {
        user_info: {
          user_id: profile.user_id,
          name: profile.name,
          level: profile.level,
          unit_max: profile.unit_max,
          energy_max: profile.energy_max,
          friend_max: profile.friend_max,
          unit_cnt: profile.unit_cnt,
          invite_code: profile.user_id.toString(),
          elapsed_time_from_login: lastLogin > 1440 ? ` ${Math.floor(lastLogin / 1440)} day(s)` : lastLogin > 60 ? ` ${Math.floor(lastLogin / 60)} hour(s)` : ` ${lastLogin} min(s)`,
          introduction: profile.introduction
        },
        center_unit_info: await user.getCenterUnitInfo(this.params.invite_code),
        setting_award_id: profile.setting_award_id
      }

      return {
        status: 200,
        result: response
      }
    } catch (err) {
      throw new ErrorCode(2400, "Center unit is missing")
    }
  }
}
