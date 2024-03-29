import moment from "moment"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      user_id: TYPE.INT
    }
  }

  public async execute() {
    const profile = await this.connection.first(`
    SELECT
      user_id, name, level, unit_max, energy_max, friend_max, introduction, last_login,
      (SELECT count(*) FROM units WHERE unit_owning_user_id=:user AND deleted=0) as unit_cnt,
      (SELECT last_activity FROM user_login WHERE user_id = :user) as last_activity,
      setting_award_id, setting_background_id
    FROM users
    WHERE user_id = :user`, {
      user: this.params.user_id
    })

    const dateNow = moment(new Date())
    const dateLastLogin = moment(new Date(profile.last_activity || profile.last_login))
    const lastLogin = Math.floor(moment.duration(dateNow.diff(dateLastLogin)).asMinutes())

    const [center, navi, friendStatus] = await Promise.all([
      this.user.getCenterUnitInfo(this.params.user_id),
      this.user.getNaviUnitInfo(this.params.user_id),
      this.user.getFriendStatus(this.user_id, this.params.user_id)
    ])
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
        elapsed_time_from_login: lastLogin > 1440 ? ` ${Math.floor(lastLogin/1440)} day(s)` : lastLogin > 60 ? ` ${Math.floor(lastLogin/60)} hour(s)` : ` ${lastLogin} min(s)`,
        introduction: profile.introduction
      },
      center_unit_info: center,
      navi_unit_info: navi,
      friend_status: friendStatus,
      setting_award_id: profile.setting_award_id,
      setting_background_id: profile.setting_background_id
    }

    return {
      status: 200,
      result: response
    }
  }
}
