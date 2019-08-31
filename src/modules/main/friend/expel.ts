import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Notice } from "../../../common/notice"
import { TYPE } from "../../../common/type"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      user_id: TYPE.INT
    }
  }

  public async execute() {
    await this.connection.query(`DELETE FROM user_friend WHERE (initiator_id = :recUser AND recipient_id = :thisUser) OR (initiator_id = :thisUser AND recipient_id = :recUser)`, {
      thisUser: this.user_id,
      recUser: this.params.user_id
    })
    await new Notice(this.connection).addNotice(this.user_id, Notice.filter().FRIENDS, Notice.noticeType().REMOVED_FROM_FRIENDS, this.params.user_id)

    return {
      status: 200,
      result: []
    }
  }
}