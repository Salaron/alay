import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebApi, ErrorAPI } from "../../../models/error"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      login: TYPE.STRING,
      password: TYPE.STRING,
      recaptcha: TYPE.STRING
    }
  }
  public async execute() {
    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error("Missing recaptcha")
      const reResult = await Utils.reCAPTCHAverify(this.params.recaptcha, Utils.getRemoteAddress(this.requestData.request))
      if (!reResult) throw new ErrorAPI("reCaptcha test failed")
    }
    const i18n = await this.i18n.getStrings(this.requestData, "login-login", "login-startup")
    const login = Utils.decryptSlAuth(this.params.login, this.requestData.auth_token)
    const password = Utils.decryptSlAuth(this.params.password, this.requestData.auth_token)

    let dataQuery = ""
    if (Utils.checkUserId(parseInt(login))) {
      // select by user id
      dataQuery = "SELECT * FROM users WHERE user_id = :login AND password = :password"
    } else if (Utils.checkMail(login)) {
      // select by mail
      dataQuery = "SELECT * FROM users WHERE mail = :login AND password = :password"
    } else throw new ErrorWebApi("Test")
    if (!Utils.checkPass(password)) throw new ErrorWebApi(i18n.passwordInvalidFormat, true)

    const data = await this.connection.first(dataQuery, {
      login,
      password
    })
    if (!data) throw new ErrorWebApi(i18n.invalidLoginOrPass, true)
    this.requestData.user_id = this.user_id = data.user_id

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
    // update our auth level
    await this.requestData.updateAuthLevel()
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
