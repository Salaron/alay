import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import moment from "moment"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes() {
    return {
      invite_code: TYPE.STRING
    }
  }

  public async execute() {
    if (parseInt(this.params.invite_code) != parseInt(this.params.invite_code)) throw new ErrorCode(2400, "Invite code is NaN")
    const user = new User(this.connection)

    let profile = await this.connection.first(`
    SELECT 
      user_id, name, level, unit_max, energy_max, friend_max, introduction, last_login,
      (SELECT count(*) FROM units WHERE unit_owning_user_id=:user AND deleted=0) as unit_cnt,
      (SELECT last_activity FROM user_login WHERE user_id = :user) as last_activity,
      setting_award_id, setting_background_id
    FROM users 
    WHERE user_id = :user AND tutorial_state = -1`, { user: this.params.invite_code })
    if (!profile) throw new ErrorCode(2400, "User not found")

    try {
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