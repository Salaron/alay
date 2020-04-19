import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"
import { AuthToken } from "../../../models/authToken"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      login_key: TYPE.STRING,
      login_passwd: TYPE.STRING
    }
  }

  public async execute() {
    if (this.requestData.auth_level > AUTH_LEVEL.UPDATE) throw new ErrorAPI(`You're already logged in`)
    if (Config.modules.login.webview_login) return {
      status: 200,
      result: {
        user_id: 0
      }
    }
    if (Config.modules.login.enable_registration === false) throw new ErrorAPI("Registration is disabled!")
    const authToken = new AuthToken(this.requestData.auth_token)
    await authToken.get()
    if (!authToken.loginKey || !authToken.loginPasswd) throw new ErrorAPI("Token doesn't exists")

    const loginKey = Utils.AESDecrypt(Buffer.from(authToken.sessionKey, "base64").slice(0, 16), this.params.login_key)
    const loginPasswd = Utils.AESDecrypt(Buffer.from(authToken.sessionKey, "base64").slice(0, 16), this.params.login_passwd)

    if (
      (typeof loginKey != "string") ||
      (typeof loginPasswd != "string") ||
      (loginKey.length != 36) ||
      (loginPasswd.length != 128) ||
      (!loginKey.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!loginPasswd.match(/^[0-9A-Z]{128}/gi))
    ) throw new Error(`Invalid credentials`)

    const password = Utils.randomString(10, "upper")
    this.user_id = (await this.connection.execute("INSERT INTO users (introduction, password, language) VALUES ('Hello!', :pass, :lang)", {
      pass: password,
      lang: Config.i18n.defaultLanguage
    })).insertId
    await this.connection.query("INSERT INTO user_login (user_id, login_key, login_passwd, login_token) VALUES (:id, :key, :pass, NULL)", {
      id: this.user_id,
      key: loginKey,
      pass: loginPasswd
    })
    await this.connection.query("INSERT INTO user_exchange_point VALUES (:user,2, 10),(:user,3, 0),(:user,4,0),(:user,5,0)", {
      user: this.user_id
    })
    await authToken.destroy()
    return {
      status: 200,
      result: {
        authorize_token: "", // will be not used anymore
        user_id: this.user_id
      }
    }
  }
}
