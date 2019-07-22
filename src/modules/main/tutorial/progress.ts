import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

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

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
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
    let currentStep = (await this.connection.first(`SELECT tutorial_state FROM users WHERE user_id = :user`, {
      user: this.user_id
    })).tutorial_state

    if (currentStep === 0 && this.formData.tutorial_state === 1) {
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