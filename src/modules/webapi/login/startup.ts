import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorAPI, ErrorWebAPI } from "../../../models/error"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      name: TYPE.STRING,
      password: TYPE.STRING,
      email: TYPE.STRING,
      recaptcha: TYPE.STRING
    }
  }
  public checkTypes() {
    if (this.params.name.length === 0 || this.params.name.length > 20) throw new ErrorAPI("Invalid name provided")
    if (!Utils.checkMailFormat(this.params.email)) throw new ErrorAPI("Invalid email provided")
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI(403)
    if (!Config.modules.login.enable_registration)
      throw new ErrorWebAPI("Registration disabled, sorry")

    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error("Missing recaptcha")
      const reResult = await Utils.reCAPTCHAverify(this.params.recaptcha, Utils.getRemoteAddress(this.requestData.request))
      if (!reResult) throw new ErrorAPI("reCaptcha test failed")
    }

    const strings = await this.i18n.getStrings(this.requestData, "login-login", "login-startup", "mailer")

    const pass = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    if (!Utils.checkPasswordFormat(pass)) throw new ErrorWebAPI(strings.passwordInvalidFormat)

    // tslint:disable-next-line
    const _mailCheck = await this.connection.first(`SELECT * FROM users WHERE mail = :mail`, {
      mail: this.params.email
    })
    if (_mailCheck) throw new ErrorWebAPI(strings.emailExists)

    const userData = await this.connection.first(`SELECT * FROM auth_tokens WHERE token = :token`, {
      token: this.requestData.auth_token
    })
    if (!userData) throw new ErrorWebAPI("Token is expired")
    if (
      (userData.login_key.length != 36) ||
      (userData.login_passwd.length != 128) ||
      (!userData.login_key.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!userData.login_passwd.match(/^[0-9A-Z]{128}/gi))
    ) throw new Error(`Invalid credentials`)

    this.user_id = (await this.connection.execute("INSERT INTO users (introduction, name, password, language, mail, tutorial_state) VALUES ('Hello!', :name, :pass, :lang, :mail, 1)", {
      name: this.params.name,
      pass,
      lang: userData.language,
      mail: this.params.email
    })).insertId
    await this.connection.query("INSERT INTO user_login (user_id, login_key, login_passwd, login_token) VALUES (:id, :key, :pass, null);", {
      id: this.user_id,
      key: userData.login_key,
      pass: userData.login_passwd
    })
    await this.connection.query("INSERT INTO user_exchange_point VALUES (:user,2, 10),(:user,3, 0),(:user,4,0),(:user,5, 0);", {
      user: this.user_id
    })

    // send mail
    const status = await Utils.sendMail(this.params.email, strings.subjectWelcome, Utils.prepareTemplate(strings.bodyWelcome, {
      userName: this.params.name
    }))

    // Destroy current token
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: {
        user_id: this.user_id,
        mail_success: status !== false
      }
    }
  }
}