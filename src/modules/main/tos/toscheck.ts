import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let check = await this.connection.first(`SELECT * FROM user_tos WHERE user_id = :user`, { user: this.user_id })
    return {
      status: 200,
      result: {
        tos_id: -1,
        tos_type: 1,
        is_agreed: typeof check != "undefined",
        server_timestamp: Utils.timeStamp()
      }
    }
  }
}