import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebApi } from "../../../models/error"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      user_id: TYPE.STRING,
      password: TYPE.STRING
    }
  }
  public async execute() {
    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error(`Missing recaptcha`)
      await Utils.reCAPTCHAverify(this.params.recaptcha, Utils.getRemoteAddress(this.requestData.request))
    }

    const strings = await this.i18n.getStrings(this.requestData, "login-login", "login-startup")
    this.user_id = parseInt(Buffer.from(Utils.RSADecrypt(this.params.user_id), "base64").toString())
    const password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()

    if (!checkUser(this.user_id)) throw new ErrorWebApi(strings.userIdShouldBeInt, true)
    if (!checkPass(password)) throw new ErrorWebApi(strings.passwordInvalidFormat, true)

    const data = await this.connection.first(`SELECT * FROM users WHERE user_id = :user AND password = :pass`, {
      user: this.user_id,
      pass: password
    })
    if (!data) throw new ErrorWebApi(strings.invalidLoginOrPass, true)
    const currentToken = await this.connection.first("SELECT login_token FROM user_login WHERE user_id = :user", {
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
    await this.requestData.updateAuthLevel()
    if (this.requestData.auth_level != AUTH_LEVEL.ADMIN) {
      this.requestData.user_id = 0
      this.requestData.auth_token = ""
      throw new ErrorWebApi("You're not an admin .-.", true)
    }
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: true,
      headers: {
        "Set-Cookie": [
          `user_id=${this.requestData.user_id}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/; SameSite=Strict;`,
          `token=${this.requestData.auth_token}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/; SameSite=Strict;`
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
