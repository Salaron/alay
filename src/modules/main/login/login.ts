import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"

export default class extends MainAction {
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
    if (this.requestData.auth_level > AUTH_LEVEL.UPDATE) throw new Error(`You're already logged in`)
    const token = await this.connection.first("SELECT * FROM auth_tokens WHERE token=:token", {
      token: this.requestData.auth_token
    })
    if (!token) throw new Error(`Token doesn't exists`)

    const loginKey = Utils.AESDecrypt(Buffer.from(token.session_key, "base64").slice(0, 16), this.params.login_key)
    const loginPasswd = Utils.AESDecrypt(Buffer.from(token.session_key, "base64").slice(0, 16), this.params.login_passwd)

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
    if (!userData) { // Invalid key/pass
      // let's check if login key already used
      const check = await this.connection.first(`SELECT * FROM user_login WHERE login_key = :key`, { key: loginKey })
      if (check) { // login key alredy exists
        // send error code 407 to client to reset keychain
        return { status: 600, result: { error_code: 407 } }
      }

      if (Config.modules.login.webview_login) return {
        status: 200,
        result: {},
        headers: {
          maintenance: 1 // redirect to webview fake maintenance page
        }
      }
      return { status: 600, result: { error_code: 407 } }
    }
    await this.connection.query("UPDATE user_login SET login_token = :token, session_key = :key WHERE user_id = :user", {
      token: newToken,
      key: token.session_key,
      user: userData.user_id
    })

    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: {
        authorize_token: newToken,
        user_id: userData.user_id,
        review_version: "", // iOS feature?
        server_timestamp: Utils.timeStamp()
      }
    }
  }
}
