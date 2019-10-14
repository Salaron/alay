import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"
import { I18n } from "../../../common/i18n"
import moment = require("moment")

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
    if (Config.modules.login.enable_recaptcha) {
      if (!Type.isString(this.params.recaptcha) || this.params.recaptcha.length === 0) throw new Error(`Missing recaptcha`)
      await Utils.reCAPTCHAverify(this.params.recaptcha, Utils.getRemoteAddress(this.requestData.request))
    }
    const i18n = new I18n(this.connection)

    const strings = await i18n.getStrings(<string>this.requestData.auth_token, "login-login", "mailer")
    const userData = await this.connection.first("SELECT name, mail FROM users WHERE mail = :mail", { mail: this.params.mail })
    if (!userData) throw new ErrorWebApi(strings.mailNotExists, true)

    const confirmationCode = Utils.randomString(10, "upper")
    await this.connection.execute(`
    INSERT INTO auth_recovery_codes (token, code, mail, expire) VALUES (:token, :code, :mail, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE code = :code, expire = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`, {
      token: this.requestData.auth_token,
      code: confirmationCode,
      mail: userData.mail
    })

    const result = await Mailer.sendMail(userData.mail, strings.subjectPasswordRecovery, Utils.prepareTemplate(strings.bodyPasswordRecovery, {
      userName: userData.name,
      code: confirmationCode,
      ip: Utils.getRemoteAddress(this.requestData.request),
      sendTime: moment().format("YYYY.MM.DD HH:mm Z")
    }))
    if (!result) throw new ErrorWebApi(strings.sendError, true)
    return {
      status: 200,
      result: true
    }
  }
}
