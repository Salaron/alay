import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"

/*
STATE = {
  START = 0,
  CHOOSE_CENTER_UNIT = 1,
  END = -1,
  SKIPPING = 50,
  MERGE_FINISHED = 100,
  MUSE = {
    SCENARIO_1 = 2,
    LIVE = 3,
    SCENARIO_2 = 4,
    MERGE = 5,
    RANK_UP = 6,
    SCENARIO_3 = 7,
    TOP = 8
  },
  AQOURS = {
    SCENARIO_1 = 12,
    LIVE = 13,
    SCENARIO_2 = 14,
    MERGE = 15,
    SCENARIO_3 = 16,
    RANK_UP = 17,
    SCENARIO_4 = 18,
    SCENARIO_5 = 19,
    TOP = 20
  }
}
*/

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      tutorial_state: TYPE.INT,
      mgd: TYPE.INT
    }
  }

  public paramCheck() {
    return true
  }

  public async execute() {
    const currentStep = (await this.connection.first(`SELECT tutorial_state FROM users WHERE user_id = :user`, {
      user: this.user_id
    })).tutorial_state

    if (currentStep === 0 && this.params.tutorial_state === 1) {
      await this.connection.query("UPDATE users SET tutorial_state = 1 WHERE user_id = :user", {
        user: this.user_id
      })
      return {
        status: 200,
        result: []
      }
    } else return {
      status: 600,
      result: { error_code: 1234 }
    }
  }
}
