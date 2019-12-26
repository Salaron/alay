import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      to_user_id: TYPE.INT,
      message: TYPE.STRING
    }
  }

  public paramCheck() {
    if (this.params.message.length > 200) throw new ErrorAPI("Too long message")
  }

  public async execute() {
    let isReply = false
    if (this.params.replied_notice_id && Type.isInt(this.params.replied_notice_id)) {
      // check if replied notice is exists
      const reply = await this.connection.first(`SELECT notice_id FROM user_greet WHERE notice_id = :id`, {
        id: this.params.replied_notice_id
      })
      if (reply.length === 0) throw new Error(`Notice ${this.params.replied_notice_id} doesn't exists`)
      isReply = true
    }

    // check if receiver is exists
    const receiver = await this.connection.first(`SELECT user_id FROM users WHERE user_id = :id`, {
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
