import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import moment from "moment"
import { ErrorWebAPI, ErrorAPI } from "../../../models/error"
import { Redis } from "../../../core/database/redis"

const expireTime = 60 * 60 // 1 hour
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

    const i18n = await this.i18n.getStrings("login-login", "mailer")
    const userData = await this.connection.first("SELECT name, mail FROM users WHERE mail = :mail", { mail: this.params.mail })
    if (!userData) throw new ErrorWebAPI(i18n.mailNotExists)

    const code = Utils.randomString(10, "upper")
    await Redis.set(`recoveryConfirmationCode:${this.requestData.auth_token}`, `${code}:${userData.mail}`, "ex", expireTime)

    const result = await Utils.sendMail(userData.mail, i18n.passwordRecovery.subject, Utils.prepareTemplate(i18n.passwordRecovery.verifyCode, {
      userName: userData.name,
      code,
      ip: Utils.getRemoteAddress(this.requestData.request),
      sendTime: moment().format("LLL Z")
    }))
    if (!result) throw new ErrorWebAPI(i18n.mailSendingError)
    return {
      status: 200,
      result: []
    }
  }
}
