import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { Mailer } from "../../../core/mailer"
import moment from "moment"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      user_id: TYPE.STRING,
      password: TYPE.STRING,
      recaptcha: TYPE.STRING
    }
  }
  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode) throw new ErrorCode(1234, "Access only with a certain auth level")

    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error(`Missing recaptcha`)
      await Utils.reCAPTCHAverify(this.params.recaptcha, Utils.getRemoteAddress(this.requestData.request))
    }
    const i18n = await this.i18n.getStrings(this.requestData, "login-login", "login-startup")

    this.user_id = parseInt(Buffer.from(Utils.RSADecrypt(this.params.user_id), "base64").toString())
    const password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()

    if (!checkUser(this.user_id)) throw new ErrorWebApi(i18n.userIdShouldBeInt, true)
    if (!checkPass(password)) throw new ErrorWebApi(i18n.passwordInvalidFormat, true)

    const transferUserData = await this.connection.first(`SELECT * FROM users WHERE user_id = :user AND password = :pass`, {
      user: this.user_id,
      pass: password
    })
    if (!transferUserData) throw new ErrorWebApi(i18n.invalidLoginOrPass, true)

    const cred = await this.connection.first(`SELECT * FROM auth_tokens WHERE token = :token`, {
      token: this.requestData.auth_token
    })
    if (!cred) throw new ErrorWebApi("Token is expired")
    if (
      (cred.login_key.length != 36) ||
      (cred.login_passwd.length != 128) ||
      (!cred.login_key.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!cred.login_passwd.match(/^[0-9A-Z]{128}/gi))
    ) throw new Error(`Invalid credentials`)
    // check if this credentials already used
    const check = await this.connection.first(`SELECT * FROM user_login WHERE login_key = :key AND login_passwd = :pass`, {
      key: cred.login_key,
      pass: cred.login_passwd
    })
    if (check) throw new ErrorWebApi(`This credentials already used`)

    await this.connection.query(`INSERT INTO user_login (user_id, login_key, login_passwd) VALUES (:user, :key, :pass) ON DUPLICATE KEY UPDATE login_key = :key, login_passwd = :pass`, {
      key: cred.login_key,
      pass: cred.login_passwd,
      user: this.user_id
    })

    if (Config.mailer.enabled) {
      const i18n = await this.i18n.getStrings(transferUserData.language, "mailer")
      await Mailer.getInstance().sendMail(transferUserData.mail, i18n.subjectNewLogin, Utils.prepareTemplate(i18n.bodyNewLogin, {
        userName: transferUserData.name,
        ip: Utils.getRemoteAddress(this.requestData.request),
        date: moment().format("YYYY.MM.DD HH:mm Z"),
        device: this.requestData.headers["os-version"]
      }))
    }
    // Destroy current token
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: true
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
