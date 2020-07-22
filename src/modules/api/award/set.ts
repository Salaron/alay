import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

const defaultUnlock = [1, 23]
const itemDB = sqlite3.getItemDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      award_id: TYPE.INT
    }
  }

  public async execute() {
    const check = await itemDB.get("SELECT award_id FROM award_m WHERE award_id = :id", {
      id: this.params.award_id
    })
    if (!check || (this.params.award_id >= 10000 && this.params.award_id <= 19999)) throw new ErrorAPI("Invalid award_id")

    if (!Config.modules.award.unlockAll && !defaultUnlock.includes(this.params.award_id)) {
      const check = await this.connection.first(`SELECT award_id FROM user_award_unlock WHERE user_id = :user AND award_id = :id`, {
        user: this.user_id,
        id: this.params.award_id
      })
      if (!check) throw new ErrorAPI(`Award "${this.params.award_id}" is not unlocked`)
    }
    await this.connection.query("UPDATE users SET setting_award_id = :id WHERE user_id = :user", {
      id: this.params.award_id,
      user: this.user_id
    })
    return {
      status: 200,
      result: []
    }
  }
}
