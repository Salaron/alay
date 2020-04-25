import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AuthToken } from "../../../models/authToken"
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

    const reResult = await Utils.recaptchaTest(this.params.recaptcha)
    if (!reResult)
      throw new ErrorWebAPI("reCAPTCHA test failed")
    const i18n = await this.i18n.getStrings("login-login", "login-startup")
    const login = Utils.simpleDecrypt(this.params.login, this.requestData.auth_token)
    const password = Utils.simpleDecrypt(this.params.password, this.requestData.auth_token)

    let transferUserDataQuery = ""
    if (Utils.checkUserIDFormat(parseInt(login))) {
      // select by user id
      transferUserDataQuery = "SELECT user_id FROM users WHERE user_id = :login AND password = :password"
    } else if (Utils.checkMailFormat(login)) {
      // select by mail
      transferUserDataQuery = "SELECT user_id FROM users WHERE mail = :login AND password = :password"
    } else throw new ErrorWebAPI(i18n.invalidUserIdOrMail)
    if (!Utils.checkPasswordFormat(password)) throw new ErrorWebAPI(i18n.passwordIncorrect)

    const transferUserData = await this.connection.first(transferUserDataQuery, {
      login,
      password
    })
    if (!transferUserData) throw new ErrorWebAPI(i18n.invalidLoginOrPass)

    const authToken = new AuthToken(this.requestData.auth_token)
    await authToken.get()
    if (this.params.type === loginType.UPDATE || this.params.type === loginType.ADMIN) {
      let redirectURL = "../static/index?id=11"
      if (this.params.type === loginType.ADMIN) {
        redirectURL = "../admin/index"
        if (!Config.server.admin_ids.includes(transferUserData.user_id))
          throw new ErrorAPI("Nice try")
      }
      // update token life-time
      // since current token is already exists we're NOT replace it
      // otherwise it can break user session
      let tokenData = await this.connection.first("SELECT login_token FROM user_login WHERE user_id = :id", {
        id: transferUserData.user_id
      })
      if (!tokenData) {
        // we used to remove user login data before
        // generate new token and insert it
        // now we don't care about token replacement
        // because user session is not exists
        tokenData = {
          login_token: Utils.randomString(80 + Math.floor(Math.random() * 10))
        }
        await this.connection.execute("INSERT INTO user_login (user_id, login_token) VALUES (:id, :token)", {
          id: transferUserData.user_id,
          token: tokenData.login_token
        })
      } else {
        // update current token life-time
        await this.connection.execute("UPDATE user_login SET last_activity = current_timestamp() WHERE user_id = :id", {
          id: transferUserData.user_id
        })
        if (this.params.type === loginType.ADMIN) {
          // also update last access to APanel
          await this.connection.execute("UPDATE user_login SET last_admin_access = current_timestamp() WHERE user_id = :id", {
            id: transferUserData.user_id
          })
        }
      }

      await authToken.destroy()
      return {
        status: 200,
        result: {
          success: true,
          redirect: redirectURL
        },
        headers: {
          "Set-Cookie": [
            Utils.getCookieHeader("user_id", transferUserData.user_id, 23),
            Utils.getCookieHeader("token", tokenData.login_token, 23)
          ]
        }
      }
    }

    if (
      (authToken.loginKey.length !== 36) ||
      (authToken.loginPasswd.length !== 128) ||
      (!authToken.loginKey.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!authToken.loginPasswd.match(/^[0-9A-Z]{128}/gi))
    ) throw new ErrorAPI("Invalid credentials")
    const isCredentialsUsed = await this.connection.first("SELECT * FROM user_login WHERE login_key = :key AND login_passwd = :pass", {
      key: authToken.loginKey,
      pass: authToken.loginPasswd
    })
    if (isCredentialsUsed) throw new ErrorWebAPI("This credentials already used")

    await this.connection.query(`
    INSERT INTO user_login (user_id, login_key, login_passwd) VALUES (:userId, :key, :pass)
    ON DUPLICATE KEY UPDATE login_key = :key, login_passwd = :pass`, {
      key: authToken.loginKey,
      pass: authToken.loginPasswd,
      userId: transferUserData.user_id
    })

    await authToken.destroy()
    return {
      status: 200,
      result: {
        success: true
      }
    }
  }
}
