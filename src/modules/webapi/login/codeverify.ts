import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"
import { I18n } from "../../../common/i18n"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      mail: TYPE.STRING,
      recaptcha: TYPE.STRING
    }
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode) throw new ErrorWebApi("Access only with a certain auth level")

    const utils = new Utils(this.connection)
    const i18n = new I18n(this.connection)
    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error(`Missing recaptcha`)
      await utils.reCAPTCHAverify(this.params.recaptcha, this.requestData.request.connection.remoteAddress)
    }

    let code = await i18n.getUserLocalizationCode(<string>this.requestData.auth_token)
    let strings = await i18n.getStrings(code, "login-login", "login-startup")

    let userData = await this.connection.first("SELECT name, mail FROM users WHERE mail = :mail", { mail: this.params.mail })
    if (!userData) throw new ErrorWebApi(strings.mailNotExists, true)
    // TODO: verify attempts caching
    // Token expiration

    let confirmationToken = Utils.randomString(6)

    //let result = await Mailer.sendMail(userData.mail, "Восстановление пароля", `Привет, ${userData.name}!\n\nВы получили это письмо, поскольку был сделан запрос на восстановление пароля от Вашего аккаунта.\nЕсли Вы этого не делали, то проигнорируйте это сообщение.\n\nДля восстановления пароля введите данный код подтверждения: ${confirmationToken}\nIP адрес отправителя: ${this.requestData.request.connection.remoteAddress}`)
    if (!undefined) throw new ErrorWebApi(strings.sendError, true)
    return {
      status: 200,
      result: true
    }
  }
}
