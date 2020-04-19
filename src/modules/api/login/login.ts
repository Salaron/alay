import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AuthToken } from "../../../models/authToken"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

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

    const newToken = Utils.randomString(80 + Math.floor(Math.random() * 10))
    const userData = await this.connection.first("SELECT user_id FROM user_login WHERE login_key = :key AND login_passwd = :pass", {
      key: loginKey,
      pass: loginPasswd
    })
    if (!userData) {
      // Invalid key/pass
      // let's check if this login key is already used
      const check = await this.connection.first(`SELECT * FROM user_login WHERE login_key = :key`, { key: loginKey })
      if (check) { // login key alredy exists
        // send code 407 to reset keychain
        throw new ErrorAPI(407)
      }

      if (Config.modules.login.webview_login) return {
        status: 200,
        result: {},
        headers: {
          maintenance: 1 // redirect to webview fake maintenance page
        }
      }
      throw new ErrorAPI(407)
    }
    await this.connection.query("UPDATE user_login SET login_token = :token, session_key = :key WHERE user_id = :user", {
      token: newToken,
      key: authToken.sessionKey,
      user: userData.user_id
    })

    await authToken.destroy()
    return {
      status: 200,
      result: {
        authorize_token: newToken,
        user_id: userData.user_id
      }
    }
  }
}
