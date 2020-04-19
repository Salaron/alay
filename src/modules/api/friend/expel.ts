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
      user_id: TYPE.INT
    }
  }

  public async execute() {
    await this.connection.query(`DELETE FROM user_friend WHERE (initiator_id = :recUser AND recipient_id = :thisUser) OR (initiator_id = :thisUser AND recipient_id = :recUser)`, {
      thisUser: this.user_id,
      recUser: this.params.user_id
    })

    return {
      status: 200,
      result: []
    }
  }
}
