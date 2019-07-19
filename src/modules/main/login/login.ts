import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return {
      login_key: TYPE.STRING,
      login_passwd: TYPE.STRING
    }
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let token = await this.connection.first("SELECT * FROM auth_tokens WHERE token=:token", { 
      token: this.requestData.auth_token 
    })
    if (!token) throw new Error(`Token doesn't exists`)

    let login_key = Utils.AESDecrypt(Buffer.from(token.session_key, "base64").slice(0, 16), this.formData.login_key)
    let login_passwd = Utils.AESDecrypt(Buffer.from(token.session_key, "base64").slice(0, 16), this.formData.login_passwd)

    if (
      (typeof login_key != "string") ||
      (typeof login_passwd != "string") ||
      (login_key.length != 36) ||
      (login_passwd.length != 128) ||
      (!login_key.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!login_passwd.match(/^[0-9A-Z]{128}/gi))
    ) throw new Error(`Invalid credentials`)

    let newToken = Utils.randomString(80 + Math.floor(Math.random() * 10))
    let userData = await this.connection.first("SELECT user_id FROM user_login WHERE login_key = :key AND login_passwd = :pass", {
      key: login_key,
      pass: login_passwd
    })
    if (!userData) return { status: 600, result: { error_code: 407 } } // Invalid key/pass
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