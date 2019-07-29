import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

const defaultUnlock = [1]
const itemDB = sqlite3.getItem()

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
      background_id: TYPE.INT
    }
  }

  public async execute() {
    let check = await itemDB.get("SELECT background_id FROM background_m WHERE background_id = :id", {
      id: this.params.background_id
    })
    if (!check) throw new ErrorUser("Invalid background_id", this.user_id)

    if (!Config.modules.background.unlockAll && !defaultUnlock.includes(this.params.background_id)) {
      let check = await this.connection.first(`SELECT background_id FROM user_background_unlock WHERE user_id = :user AND background_id = :id`, {
        user: this.user_id,
        id: this.params.background_id
      })
      if (!check) throw new ErrorUser(`User not yet unlocked background ${this.params.background_id}`, this.user_id)
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