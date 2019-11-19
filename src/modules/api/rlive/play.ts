import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, RESPONSE_TYPE } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import executeAction from "../../../handlers/action"
import { Utils } from "../../../common/utils"

const liveDB = sqlite3.getLive()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      party_user_id: TYPE.INT,
      unit_deck_id: TYPE.INT,
      token: TYPE.STRING
    }
  }

  public async execute() {
    const session = await this.connection.first("SELECT * FROM user_live_random WHERE token = :token AND user_id = :userId", {
      token: this.params.token,
      userId: this.user_id
    })
    if (!session) throw new ErrorCode(1234, "Session is missing [/shrug]")
    const prevSession = await this.connection.query("SELECT * FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    if (prevSession.length > 0) throw new ErrorCode(1234, "Another live session in progress!")

    await this.connection.execute("UPDATE user_live_random SET in_progress = 1 WHERE user_id = :user AND token = :token", {
      user: this.user_id,
      token: this.params.token
    })
    this.requestData.params.live_difficulty_id = session.live_difficulty_id.toString()
    const result = (await executeAction("live", "play", this.requestData, {
      responseType: RESPONSE_TYPE.SINGLE
    })).result

    return {
      status: 200,
      result
    }
  }
}
