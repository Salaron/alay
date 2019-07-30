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
      user_id: TYPE.INT
    }
  }

  public async execute() {
    // Check if this user already send request to us
    let check = await this.connection.first(`SELECT * FROM user_friend WHERE initiator_id = :recUser AND recipient_id = :thisUser`, {
      recUser: this.params.user_id,
      thisUser: this.user_id
    })

    let isFriend = false
    if (check) {
      // just agree their request
      await this.connection.query(`UPDATE user_friend SET status = 1, agree_date = CURRENT_TIMESTAMP WHERE initiator_id = :recUser AND recipient_id = :thisUser`, {
        recUser: this.params.user_id,
        thisUser: this.user_id
      })
      isFriend = true
      await new Notice(this.connection).addNotice(this.user_id, Notice.filter().FRIENDS, Notice.noticeType().ACCEPTED_FRIEND_REQUEST, this.params.user_id)
    } else {
      await this.connection.query(`INSERT INTO user_friend (initiator_id, recipient_id, status) VALUES (:init, :rec, 0)`, {
        init: this.user_id,
        rec: this.params.user_id
      })
      await new Notice(this.connection).addNotice(this.user_id, Notice.filter().FRIENDS, Notice.noticeType().SEND_FRIEND_REQUEST, this.params.user_id)
    }
    return {
      status: 200,
      result: { 
        is_friend: isFriend
      }
    }
  }
}