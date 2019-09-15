import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const response = {
      new_achievement_cnt: 0,
      unaccomplished_achievement_cnt: 0,
      handover_expire_status: 0,
      live_daily_reward_exist: false,
      training_energy: 5,
      training_energy_max: 5,
      notification: {
        push: false,
        lp: false,
        update_info: false,
        campaign: false,
        live: false,
        lbonus: true,
        muse_event: false,
        muse_secretbox: false,
        muse_birthday: true,
        aqours_event: false,
        aqours_secretbox: false,
        aqours_birthday: true
      }
    }

    return {
      status: 200,
      result: response
    }
  }
}
