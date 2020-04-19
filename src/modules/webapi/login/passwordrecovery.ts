import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import moment from "moment"
import { ErrorWebAPI, ErrorAPI } from "../../../models/error"
import { Redis } from "../../../core/database/redis"

const expireTime = 1000 * 60 * 60 // 1 hour
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
    if (this.requestData.auth_level !== this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI(403)

    const reResult = await Utils.recaptchaTest(this.params.recaptcha)
    if (!reResult)
      throw new ErrorWebAPI("reCAPTCHA test failed")

    const i18n = await this.i18n.getStrings(this.requestData, "login-login", "mailer")
    const userData = await this.connection.first("SELECT name, mail FROM users WHERE mail = :mail", { mail: this.params.mail })
    if (!userData) throw new ErrorWebAPI(i18n.mailNotExists)

    const code = Utils.randomString(10, "upper")
    await Redis.set(`recoveryConfirmationCode:${this.requestData.auth_token}`, `${code}:${userData.mail}`, "ex", expireTime)
    await this.connection.execute(`
    INSERT INTO auth_recovery_codes (token, code, mail, expire) VALUES (:token, :code, :mail, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE code = :code, expire = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`, {
      token: this.requestData.auth_token,
      code,
      mail: userData.mail
    })

    const result = await Utils.sendMail(userData.mail, i18n.subjectPasswordRecovery, Utils.prepareTemplate(i18n.bodyPasswordRecovery, {
      userName: userData.name,
      code,
      ip: Utils.getRemoteAddress(this.requestData.request),
      sendTime: moment().format("LLL Z")
    }))
    if (!result) throw new ErrorWebAPI(i18n.mailSendingError)
    return {
      status: 200,
      result: true
    }
  }
}
