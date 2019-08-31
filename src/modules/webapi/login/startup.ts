import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, TYPE } from "../../../types/const"

let i18n: any = {}

export default class {
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
      name: TYPE.STRING,
      password: TYPE.STRING,
      mail: TYPE.STRING,
      recaptcha: TYPE.STRING
    }
  }
  public checkTypes() {
    if (this.params.name.length === 0 || this.params.name.length > 20) throw new ErrorCode(1234, "Invalid name provided")
    if (!checkMail(this.params.mail)) throw new ErrorCode(1234, "Invalid mail provided")
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode) throw new ErrorCode(1234, "Access only with a certain auth level")
    const utils = new Utils(this.connection)
    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error(`Missing recaptcha`)
      await utils.reCAPTCHAverify(this.params.recaptcha, this.requestData.request.connection.remoteAddress)
    }
    
    let code = await utils.getUserLangCode(this.user_id, true, <string>this.requestData.auth_token)
    if (Object.keys(i18n).length === 0) i18n = await utils.loadLocalization("login-startup", "login-login")
    let strings = i18n[code]
    if (Type.isNullDef(strings)) throw new Error(`Can't find language settings for code ${code}`)

    let pass = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    if (!checkPass(pass)) throw new ErrorWebApi(strings.passwordInvalidFormat, true)

    let _mailCheck = await this.connection.first(`SELECT * FROM users WHERE mail = :mail`, {
      mail: this.params.mail
    })
    if (_mailCheck) throw new ErrorWebApi(strings.emailExists, true)

    let userData = await this.connection.first(`SELECT * FROM auth_tokens WHERE token = :token`, {
      token: this.requestData.auth_token
    })
    if (!userData) throw new ErrorWebApi("Token is expired")
    if (
      (userData.login_key.length != 36) ||
      (userData.login_passwd.length != 128) ||
      (!userData.login_key.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
      (!userData.login_passwd.match(/^[0-9A-Z]{128}/gi))
    ) throw new Error(`Invalid credentials`)

    this.user_id = (await this.connection.execute("INSERT INTO users (introduction, name, password, language, mail, tutorial_state) VALUES ('Hello!', :name, :pass, :lang, :mail, 1)", {
      name: this.params.name,
      pass: pass, 
      lang: userData.language,
      mail: this.params.mail
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
    await Mailer.sendMail(this.params.mail, "Welcome to SunLight Server!", `Привет, ${this.params.name}!\n\nВы получили данное письмо, потому что Ваша почта была указана при регистрации на пользовательском сервере по игре Love Live! School Idol Festival.\n\nВ дальнейшем этот адрес эл. почты будет использоваться для оповещения и подтверждения действий, связанных с Вашим аккаунтом.`)

    // Destroy current token
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: {
        user_id: this.user_id
      }
    }
  }
}
function checkPass(input: string) {
  return input.match(/^[A-Za-z0-9]\w{1,32}$/)
}
function checkMail(input: string) {
  let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,6})+$/
  return regex.test(input)
}