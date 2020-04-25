import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebAPI } from "../../../models/error"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      nickname: TYPE.STRING
    }
  }

  public async execute() {
    const i18n = await this.i18n.getStrings("login-startup")
    if (this.params.nickname.length === 0 || this.params.nickname.length > 18) throw new ErrorWebAPI(i18n.nicknameIncorrect)
    await this.connection.execute("UPDATE users SET name = :name WHERE user_id = :userId", {
      name: this.params.nickname,
      userId: this.user_id
    })
    return {
      status: 200,
      result: []
    }
  }
}
