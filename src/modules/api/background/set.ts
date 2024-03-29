import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"

const defaultUnlock = [1]
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
      background_id: TYPE.INT
    }
  }

  public async execute() {
    const check = await itemDB.get("SELECT background_id FROM background_m WHERE background_id = :id", {
      id: this.params.background_id
    })
    if (!check) throw new Error("Invalid background_id")

    if (!Config.modules.background.unlockAll && !defaultUnlock.includes(this.params.background_id)) {
      const check = await this.connection.first(`SELECT background_id FROM user_background_unlock WHERE user_id = :user AND background_id = :id`, {
        user: this.user_id,
        id: this.params.background_id
      })
      if (!check) throw new Error(`User not yet unlocked background ${this.params.background_id}`)
    }
    await this.connection.query("UPDATE users SET setting_background_id = :id WHERE user_id = :user", {
      id: this.params.background_id,
      user: this.user_id
    })
    return {
      status: 200,
      result: []
    }
  }
}
