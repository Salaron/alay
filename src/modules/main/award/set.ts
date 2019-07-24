import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

const defaultUnlock = [1, 23]
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
      award_id: TYPE.INT
    }
  }

  public async execute() {
    let check = await itemDB.get("SELECT award_id FROM award_m WHERE award_id = :id", {
      id: this.params.award_id
    })
    if (!check) throw new ErrorUser("Invalid award_id", this.user_id)

    if (!Config.modules.award.unlockAll && !defaultUnlock.includes(this.params.award_id)) {
      let check = await this.connection.first(`SELECT award_id FROM user_award_unlock WHERE user_id = :user AND award_id = :id`, {
        user: this.user_id,
        id: this.params.award_id
      })
      if (!check) throw new ErrorUser(`User not yet unlocked award ${this.params.award_id}`, this.user_id)
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