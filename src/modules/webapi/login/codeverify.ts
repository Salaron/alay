import assert from "assert"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebAPI, ErrorAPI } from "../../../models/error"
import { Redis } from "../../../core/database/redis"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      code: TYPE.STRING
    }
  }
  public paramCheck() {
    assert(Utils.checkPasswordFormat(this.params.code) && this.params.code.length === 10, "Invalid code format")
  }

  public async execute() {
    if (this.requestData.auth_level !== this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI(403)

    const i18n = await this.i18n.getStrings("login-login", "mailer")
    let recoveryData = await Redis.get(`recoveryConfirmationCode:${this.requestData.auth_token}`)
    if (!recoveryData) throw new ErrorWebAPI(i18n.confirmationCodeNotExists)
    const code = recoveryData.split(":")[0]
    if (code !== this.params.code.toUpperCase())
      throw new ErrorWebAPI(i18n.confirmationCodeNotMatch)
    const mail = recoveryData.split(":")[1]
    const newPassword = Utils.randomString(10, "upper")
    // TODO: "salt" passwords
    await this.connection.execute("UPDATE users SET password = :pass WHERE mail = :mail", {
      mail,
      pass: newPassword
    })
    const userData = await this.connection.first("SELECT user_id FROM users WHERE mail = :mail", {
      mail
    })
    await Redis.del(`recoveryConfirmationCode:${this.requestData.auth_token}`)
    const result = await Utils.sendMail(mail, i18n.passwordRecovery.subject, Utils.prepareTemplate(i18n.passwordRecovery.newPassword, {
      userId: userData.user_id,
      password: newPassword
    }))
    if (!result) throw new ErrorWebAPI(i18n.mailSendingError)
    return {
      status: 200,
      result: true
    }
  }
}
