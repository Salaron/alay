import { TYPE } from "../../../common/type"
import { User } from "../../../common/user"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
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
      incentive_id: TYPE.INT
    }
  }

  public async execute() {
    try {
      const beforeUserInfo = await this.user.getUserInfo(this.user_id)
      let result = await this.item.openPresent(this.user_id, this.params.incentive_id)

      return {
        status: 200,
        result: {
          opened_num: 1,
          success: [result],
          before_user_info: beforeUserInfo,
          after_user_info: await this.user.getUserInfo(this.user_id),
          class_system: User.getClassSystemStatus(this.user_id),
          unit_support_list: await this.user.getSupportUnits(this.user_id)
        }
      }
    } catch (err) {
      if (err.message == "Present is already collected") throw new ErrorAPI(1201) // ERROR_CODE_INCENTIVE_NONE
      else throw err
    }
  }
}
