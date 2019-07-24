import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

const unitDB = sqlite3.getUnit()

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
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
      if (err.message == "Present is already collected") throw new ErrorCode(1234) // rnd code 
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