import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"

const supportedParams = Config.i18n.supportedLanguages
const convert = Config.i18n.langCodes

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      lang: TYPE.STRING
    }
  }

  public async execute() {
    if (!supportedParams.includes(this.params.lang)) throw new Error(`Unsupported language`)
    let langCode = convert[this.params.lang]
    if (!langCode) throw new Error(`Can't find suitable language code`)
    let query = "UPDATE users SET language = :lang WHERE user_id = :user"

    if (this.requestData.auth_level === AUTH_LEVEL.PRE_LOGIN) {
      query = "UPDATE auth_tokens SET language = :lang WHERE token = :token"
    }
    await this.connection.execute(query, {
      lang: langCode,
      user: this.user_id,
      token: this.requestData.auth_token
    })

    return {
      status: 200,
      result: true
    }
  }
}