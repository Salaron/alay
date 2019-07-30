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
      user_id: TYPE.INT,
      status: TYPE.INT
    }
  }

  public async execute() {
    switch (this.params.status) {
      case 0: {
        // request rejected
        await this.connection.query(`DELETE FROM user_friend WHERE initiator_id = :init AND recipient_id = :rec`, {
          init: this.params.user_id,
          rec: this.user_id
        })
        await new Notice(this.connection).addNotice(this.user_id, Notice.filter().FRIENDS, Notice.noticeType().REJECTED_FRIEND_REQUEST, this.params.user_id)
        break
      }
      case 2: {
        // request accepted
        await this.connection.query(`UPDATE user_friend SET status = 1, agree_date = CURRENT_TIMESTAMP WHERE initiator_id = :init AND recipient_id = :rec`, {
          init: this.params.user_id,
          rec: this.user_id
        })
        await new Notice(this.connection).addNotice(this.user_id, Notice.filter().FRIENDS, Notice.noticeType().ACCEPTED_FRIEND_REQUEST, this.params.user_id)
        break
      }
      default: throw new ErrorUser(`Unknown status: ${this.params.status}`, this.user_id)
    }
    return {
      status: 200,
      result: []
    }
  }
}