import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

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
      user_id: TYPE.STRING,
      password: TYPE.STRING
    }
  }
  public async execute() {
    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error(`recaptcha is not passed`)
      await new Utils(this.connection).reCAPTCHAverify(this.params.recaptcha, this.requestData.request.connection.remoteAddress)
    }
    let decrypted = Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString()
    this.user_id = parseInt(Buffer.from(Utils.RSADecrypt(this.params.user_id), "base64").toString())
    let pass = Utils.xor(decrypted, this.requestData.auth_token).toString()

    if (!checkUser(this.user_id)) throw new Error(`User ID is not integer`)
    if (!checkPass(pass)) throw new Error(`Used forbidden characters`)

    let data = await this.connection.first(`SELECT * FROM users WHERE user_id = :user AND password = :pass`, {
      user: this.user_id,
      pass: pass
    })
    if (!data) throw new ErrorCode(1234, "Invalid User ID / Password")
    let currentToken = await this.connection.first("SELECT login_token FROM user_login WHERE user_id = :user", {
      user: this.user_id
    })
    if (!currentToken || !currentToken.login_token) {
      // This account doesn't have credentials...
      await this.connection.execute("INSERT INTO user_login (user_id, login_token) VALUES (:user, :token) ON DUPLICATE KEY UPDATE login_token = :token", {
        user: this.user_id,
        token: this.requestData.auth_token
      })
    } else {
      this.requestData.auth_token = currentToken.login_token
      await this.connection.execute("UPDATE user_login SET last_activity = CURRENT_TIMESTAMP WHERE user_id = :user", {
        user: this.user_id
      })
    }
    this.requestData.user_id = this.user_id
    // update our auth level
    await this.requestData.getAuthLevel({ force: true })
    if (this.requestData.auth_level != AUTH_LEVEL.ADMIN) {
      this.requestData.user_id = null
      this.requestData.auth_token = null
      throw new ErrorCode(1234, "You're not an admin!")
    }
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: true,
      headers: {
        "Set-Cookie": [
          `user_id=${this.requestData.user_id}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/;`,
          `token=${this.requestData.auth_token}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/;`
        ]
      }
    }
  }
}

function checkPass(input: any) {
  return input.match(/^[A-Za-z0-9]\w{1,32}$/)
}
function checkUser(input: any) {
  return (
    input.toString().match(/^[0-9]\w{0,10}$/) &&
    parseInt(input) === parseInt(input) &&
    parseInt(input) > 0
  )
}