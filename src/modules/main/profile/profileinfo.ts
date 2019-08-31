import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../core/requestData"
import moment from "moment"
import { User } from "../../../common/user"

export default class extends MainAction {
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
    const user = new User(this.connection)

    let profile = await this.connection.first(`
    SELECT 
      user_id, name, level, unit_max, energy_max, friend_max, introduction, last_login,
      (SELECT count(*) FROM units WHERE unit_owning_user_id=:user AND deleted=0) as unit_cnt,
      (SELECT last_activity FROM user_login WHERE user_id = :user) as last_activity,
      setting_award_id, setting_background_id
    FROM users 
    WHERE user_id = :user`, { 
      user: this.params.user_id
    })

    let dateNow = moment(new Date())
    let dateLastLogin = moment(new Date(profile.last_activity || profile.last_login))
    let lastLogin = Math.floor(moment.duration(dateNow.diff(dateLastLogin)).asMinutes())

    let response = {
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
      center_unit_info: await user.getCenterUnitInfo(this.params.user_id),
      navi_unit_info: await user.getNaviUnitInfo(this.params.user_id),
      friend_status: await user.getFriendStatus(this.user_id, this.params.user_id),
      setting_award_id: profile.setting_award_id,
      setting_background_id: profile.setting_background_id
    }

    return {
      status: 200,
      result: response
    }
  }
}