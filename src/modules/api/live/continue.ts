import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const session = await this.connection.first("SELECT * FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    if (!session) throw new Error(`No active live session`)

    // after this client will call live/gameover so we don't need to clear user session from here
    if (
      session.continue_attempts + 1 > Config.modules.live.continueAttemptsCount &&
      Config.modules.live.continueAttemptsCount != 0
    ) throw new ErrorAPI("Max continue attempts reached")

    const before = await this.connection.first(`SELECT sns_coin FROM users WHERE user_id = :user`, { user: this.user_id })
    if (before.sns_coin - 1 < 0) throw new ErrorAPI(720, "Not enough loveca")
    await this.connection.query(`UPDATE users SET sns_coin=sns_coin - 1 WHERE user_id = :user`, { user: this.user_id })
    await this.connection.query(`UPDATE user_live_progress SET continue_attempts=continue_attempts + 1 WHERE user_id = :user`, {
      user: this.user_id
    })

    return {
      status: 200,
      result: {
        before_sns_coin: before.sns_coin,
        after_sns_coin: before.sns_coin - 1
      }
    }
  }
}
