import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"

const langCodes = Object.values(Config.i18n.languages)

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      code: TYPE.STRING
    }
  }

  public async execute() {
    if (!langCodes.includes(this.params.code)) throw new Error(`Unsupported language code`)
    const input: any = this.user_id === null ? this.requestData.auth_token : this.user_id
    await this.i18n.setUserLocalizationCode(input, this.params.code)

    return {
      status: 200,
      result: true
    }
  }
}
