import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import moment from "moment"
import { ErrorWebAPI, ErrorAPI } from "../../../models/error"

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
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI(403)

    const reResult = await Utils.recaptchaTest(this.params.recaptcha)
    if (!reResult)
      throw new ErrorWebAPI("reCAPTCHA test failed")

    const strings = await this.i18n.getStrings(this.requestData, "login-login", "mailer")
    const userData = await this.connection.first("SELECT name, mail FROM users WHERE mail = :mail", { mail: this.params.mail })
    if (!userData) throw new ErrorWebAPI(strings.mailNotExists)

    const confirmationCode = Utils.randomString(10, "upper")
    await this.connection.execute(`
    INSERT INTO auth_recovery_codes (token, code, mail, expire) VALUES (:token, :code, :mail, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE code = :code, expire = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`, {
      token: this.requestData.auth_token,
      code: confirmationCode,
      mail: userData.mail
    })

    const result = await Utils.sendMail(userData.mail, strings.subjectPasswordRecovery, Utils.prepareTemplate(strings.bodyPasswordRecovery, {
      userName: userData.name,
      code: confirmationCode,
      ip: Utils.getRemoteAddress(this.requestData.request),
      sendTime: moment().format("YYYY.MM.DD HH:mm Z")
    }))
    if (!result) throw new ErrorWebAPI(strings.sendError)
    return {
      status: 200,
      result: true
    }
  }
}
