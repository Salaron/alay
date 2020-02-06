import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorUserId, ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      is_send_mail: TYPE.BOOLEAN,
      mail_notice_id: TYPE.INT
    }
  }

  public async execute() {
    // check if notice is exists
    const notice = await this.connection.first(`SELECT * FROM user_greet WHERE notice_id = :id`, {
      id: this.params.mail_notice_id
    })
    if (!notice) throw new ErrorAPI(403)

    if (this.params.is_send_mail === true && notice.affector_id === this.user_id) {
      await this.connection.query(`UPDATE user_greet SET deleted_from_affector = 1 WHERE notice_id = :id`, {
        id: this.params.mail_notice_id
      })
    } else if (this.params.is_send_mail === false && notice.receiver_id === this.user_id) {
      await this.connection.query(`UPDATE user_greet SET deleted_from_receiver = 1 WHERE notice_id = :id`, {
        id: this.params.mail_notice_id
      })
    } else {
      throw new ErrorUserId(`You're not receiver or owner of this notice`, this.user_id)
    }

    return {
      status: 200,
      result: []
    }
  }
}
