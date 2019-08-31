import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { User } from "../../../common/user"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: await new User(this.connection).getRemovableSkillInfo(this.user_id)
    }
  }
}