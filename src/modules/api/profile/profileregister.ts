import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      introduction: TYPE.STRING
    }
  }

  public paramCheck() {
    if (this.params.introduction.length > 200) throw new ErrorCode(1112, "Too long introduction")
  }

  public async execute() {
    try {
      if (this.params.introduction.split(/\n/gm).length > 6) throw new ErrorCode(1106, "ERROR_CODE_ONLY_WHITESPACE_CHARACTERS")
      await this.connection.query(`UPDATE users SET introduction = :intro WHERE user_id = :user`, {
        intro: this.params.introduction,
        user: this.params.user_id
      })
    } catch (err) {
      throw new ErrorCode(1234, "Used banned characters")
    }

    return {
      status: 200,
      result: []
    }
  }
}
