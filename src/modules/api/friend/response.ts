import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
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
        await this.notice.addNotice(this.user_id, this.notice.FILTER.FRIENDS, this.notice.TYPE.REJECTED_FRIEND_REQUEST, this.params.user_id)
        break
      }
      case 2: {
        // request accepted
        await this.connection.query(`UPDATE user_friend SET status = 1, agree_date = CURRENT_TIMESTAMP WHERE initiator_id = :init AND recipient_id = :rec`, {
          init: this.params.user_id,
          rec: this.user_id
        })
        await this.notice.addNotice(this.user_id, this.notice.FILTER.FRIENDS, this.notice.TYPE.ACCEPTED_FRIEND_REQUEST, this.params.user_id)
        break
      }
      default: throw new Error(`Unknown status: ${this.params.status}`)
    }
    return {
      status: 200,
      result: []
    }
  }
}
