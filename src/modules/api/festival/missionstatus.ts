import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: {
        now_mission: {
          level: 1,
          chance_count: 1,
          achievement_type: 1,
          achievement_condition_id_list: [
            98
          ],
          is_special: false,
          play_count: 0,
          achieved_count: 0,
          achievement_count: 1,
          description: "",
          time_limit: 0,
          result: 1,
          first_clear_bonus: {
            reward_list: [],
            bonus_list: []
          },
          clear_bonus: {
            reward_list: [],
            bonus_list: []
          }
        },
        mission_status_list: [],
        next_page_id: 0
      }
    }
  }
}
