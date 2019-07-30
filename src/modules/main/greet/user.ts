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
  private User: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes() { 
    return {
      to_user_id: TYPE.INT,
      message: TYPE.STRING
    }
  }

  public paramCheck() {
    if (this.params.message.length > 200) throw new ErrorCode(1234, "Too long message")
  }

  public async execute() {
    let isReply = false
    if (this.params.replied_notice_id && Type.isInt(this.params.replied_notice_id)) {
      // check if replied notice is exists
      let reply = await this.connection.first(`SELECT notice_id FROM user_greet WHERE notice_id = :id`, { 
        id: this.params.replied_notice_id 
      })
      if (reply.length === 0) throw new Error(`Notice ${this.params.replied_notice_id} doesn't exists`)
      isReply = true
    }

    // check if receiver is exists
    let receiver = await this.connection.first(`SELECT user_id FROM users WHERE user_id = :id`, { 
      id: this.params.to_user_id 
    })
    if (receiver.length === 0) throw new Error(`User #${this.params.replied_notice_id} doesn't exists`)

    await this.connection.query(`INSERT INTO user_greet (affector_id, receiver_id, message, reply) VALUES (:affector, :receiver, :msg, :reply)`, {
      affector: this.user_id,
      receiver: this.params.to_user_id,
      msg: this.params.message,
      reply: isReply
    })

    return {
      status: 200,
      result: []
    }
  }
}