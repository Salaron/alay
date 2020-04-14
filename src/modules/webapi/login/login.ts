import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorAPI, ErrorWebAPI } from "../../../models/error"
import { loginType } from "../../webview/login/login"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

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
    if (!Type.isInt(this.params.type) && this.requestData.auth_level !== AUTH_LEVEL.PRE_LOGIN)
      throw new ErrorAPI("No permissions")

    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error("Missing recaptcha")
      const reResult = await Utils.reCAPTCHAverify(this.params.recaptcha, Utils.getRemoteAddress(this.requestData.request))
      if (!reResult) throw new ErrorAPI("reCaptcha test failed")
    }
    const i18n = await this.i18n.getStrings(this.requestData, "login-login", "login-startup")
    const login = Utils.decryptSlAuth(this.params.login, this.requestData.auth_token)
    const password = Utils.decryptSlAuth(this.params.password, this.requestData.auth_token)

    let transferUserDataQuery = ""
    if (Utils.checkUserIDFormat(parseInt(login))) {
      // select by user id
      transferUserDataQuery = "SELECT user_id FROM users WHERE user_id = :login AND password = :password"
    } else if (Utils.checkMailFormat(login)) {
      // select by mail
      transferUserDataQuery = "SELECT user_id FROM users WHERE mail = :login AND password = :password"
    } else throw new ErrorWebAPI(i18n.invalidUserIdOrMail)
    if (!Utils.checkPasswordFormat(password)) throw new ErrorWebAPI(i18n.passwordInvalidFormat)

    const transferUserData = await this.connection.first(transferUserDataQuery, {
      login,
      password
    })
    if (!transferUserData) throw new ErrorWebAPI(i18n.invalidLoginOrPass)

    if (this.params.type === loginType.UPDATE) {
      // update token time
      let tokenData = await this.connection.first("SELECT login_token FROM user_login WHERE user_id = :id", {
        id: transferUserData.user_id
      })
      if (!tokenData) {
        // insert new token
        tokenData = {
          login_token: Utils.randomString(80 + Math.floor(Math.random() * 10))
        }
        await this.connection.execute("INSERT INTO user_login (user_id, login_token) VALUES (:id, :token)", {
          id: transferUserData.user_id,
          token: tokenData.login_token
        })
      } else {
        // update current token valid date
        await this.connection.execute("UPDATE user_login SET last_activity = current_timestamp() WHERE user_id = :id", {
          id: transferUserData.user_id
        })
      }

      // destroy token
      await this.connection.query("DELETE FROM auth_tokens WHERE token = :token", { token: this.requestData.auth_token })
      return {
        status: 200,
        result: {
          success: true,
          redirect: "../static/index?id=11"
        },
        headers: {
          "Set-Cookie": [
            `user_id=${transferUserData.user_id}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/; SameSite=Strict;`,
            `token=${tokenData.login_token}; expires=${new Date(new Date().getTime() + 600000).toUTCString()}; path=/; SameSite=Strict;`
          ]
        }
      }
    }

    const cred = await this.connection.first("SELECT * FROM auth_tokens WHERE token = :token", {
      token: this.requestData.auth_token
    })
    if (!cred) throw new ErrorWebAPI("Close this tab and try again")
    if (
      (cred.login_key.length !== 36) ||
      (cred.login_passwd.length !== 128) ||
      (!cred.login_key.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!cred.login_passwd.match(/^[0-9A-Z]{128}/gi))
    ) throw new Error("Invalid credentials")
    const check = await this.connection.first("SELECT * FROM user_login WHERE login_key = :key AND login_passwd = :pass", {
      key: cred.login_key,
      pass: cred.login_passwd
    })
    if (check) throw new ErrorWebAPI("This credentials already used")

    await this.connection.query(`INSERT INTO user_login (user_id, login_key, login_passwd) VALUES (:userId, :key, :pass) ON DUPLICATE KEY UPDATE login_key = :key, login_passwd = :pass`, {
      key: cred.login_key,
      pass: cred.login_passwd,
      userId: transferUserData.user_id
    })

    // Destroy current token
    await this.connection.query("DELETE FROM auth_tokens WHERE token = :token", { token: this.requestData.auth_token })
    return {
      status: 200,
      result: {
        success: true
      }
    }
  }
}
