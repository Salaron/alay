import assert from "assert"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebAPI, ErrorAPI } from "../../../models/error"

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
    assert(Utils.checkPass(this.params.code) && this.params.code.length === 10, "Invalid code format")
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel && !Config.server.debug_mode)
      throw new ErrorAPI(403)

    const strings = await this.i18n.getStrings(this.requestData, "login-login", "mailer")

    const recoveryData = await this.connection.first("SELECT * FROM auth_recovery_codes WHERE token = :token AND expire > CURRENT_TIMESTAMP", {
      token: this.requestData.auth_token
    })
    if (!recoveryData) throw new ErrorWebAPI(strings.confirmationCodeNotExists)
    if (recoveryData.code != this.params.code.toUpperCase()) throw new ErrorWebAPI(strings.confirmationCodeNotMatch)

    const newPassword = Utils.randomString(10, "upper")
    // TODO: "salt" passwords
    await this.connection.execute("UPDATE users SET password = :pass WHERE mail = :mail", {
      mail: recoveryData.mail,
      pass: newPassword
    })
    await this.connection.execute("DELETE FROM auth_recovery_codes WHERE token = :token", {
      token: this.requestData.auth_token
    })
    const userData = await this.connection.first("SELECT user_id FROM users WHERE mail = :mail", {
      mail: recoveryData.mail
    })

    const result = await Utils.sendMail(recoveryData.mail, strings.subjectPasswordRecovery, Utils.prepareTemplate(strings.bodyPasswordRecovered, {
      userId: userData.user_id,
      password: newPassword
    }))
    if (!result) throw new ErrorWebAPI(strings.sendError)
    return {
      status: 200,
      result: true
    }
  }
}
