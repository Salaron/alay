import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

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
      notice_id : TYPE.INT
    }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    // check if this notice is exists
    let check = await this.connection.first("SELECT * FROM user_personal_notice WHERE user_id = :user AND notice_id = :id", {
      user: this.user_id,
      id: this.params.notice_id
    })
    if (!check) throw new ErrorUser(`Personalnotice ${this.params.notice_id} doesn't exist`, this.user_id)
    await this.connection.query("UPDATE user_personal_notice SET agreed = 1 WHERE user_id = :user AND notice_id = :id", {
      user: this.user_id,
      id: this.params.notice_id
    })

    return {
      status: 200,
      result: []
    }
  }
}