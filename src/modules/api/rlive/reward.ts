import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import executeAction from "../../../handlers/action"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE, RESPONSE_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const liveDB = sqlite3.getLiveDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      perfect_cnt: TYPE.INT,
      great_cnt: TYPE.INT,
      good_cnt: TYPE.INT,
      bad_cnt: TYPE.INT,
      miss_cnt: TYPE.INT,
      love_cnt: TYPE.INT,
      max_combo: TYPE.INT,
      score_smile: TYPE.INT,
      score_cute: TYPE.INT,
      score_cool: TYPE.INT,
      token: TYPE.STRING
    }
  }

  public async execute() {
    const [liveSession, rSession] = await Promise.all([
      this.connection.first("SELECT * FROM user_live_progress WHERE user_id = :user", { user: this.user_id }),
      this.connection.first("SELECT * FROM user_live_random WHERE token = :token AND user_id = :userId", {
        token: this.params.token,
        userId: this.user_id
      })
    ])
    if (!rSession || !liveSession || liveSession.live_difficulty_id != rSession.live_difficulty_id)
      throw new ErrorAPI(3411, "ERROR_CODE_LIVE_PLAY_DATA_NOT_FOUND")

    this.requestData.params.live_difficulty_id = liveSession.live_difficulty_id

    const result = (await executeAction("live", "reward", this.requestData, {
      responseType: RESPONSE_TYPE.SINGLE
    })).result

    await this.connection.execute("DELETE FROM user_live_random WHERE user_id = :user AND token = :token", {
      token: this.params.token,
      user: this.user_id
    })

    return {
      status: 200,
      result
    }
  }
}
