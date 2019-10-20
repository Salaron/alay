import RequestData from "../../../core/requestData"
import { TYPE } from "../../../common/type"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

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
    // check if this is SunLight client
    // it has a feature for get profile info
    return {
      status: 200,
      result: []
    }
    throw new ErrorCode(11102)
  }
}
