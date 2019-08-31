import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { User } from "../../../common/user"
import { Item } from "../../../common/item"
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
      incentive_id: TYPE.INT
    }
  }

  public async execute() {
    const user = new User(this.connection)

    let beforeUserInfo = await user.getUserInfo(this.user_id)
    let result
    try {
      result = await new Item(this.connection).openPresent(this.user_id, this.params.incentive_id)
    } catch (err) {
      if (err.message == "Present is already collected") throw new ErrorCode(1201) // ERROR_CODE_INCENTIVE_NONE 
      else throw err
    }

    return {
      status: 200,
      result: {
        opened_num: 1,
        success: [result],
        before_user_info: beforeUserInfo,
        after_user_info: await user.getUserInfo(this.user_id),
        class_system: User.getClassSystemStatus(this.user_id),
        unit_support_list: await user.getSupportUnits(this.user_id)
      }
    }
  }
}