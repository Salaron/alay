import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebAPI } from "../../../models/error"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      newPassword: TYPE.STRING,
      password: TYPE.STRING
    }
  }

  public async execute() {
    const strings = await this.i18n.getStrings(this.requestData, "login-startup", "settings-index", "mailer")

    const password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    const newPassword = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.newPassword), "base64").toString(), this.requestData.auth_token).toString()
    if (!Utils.checkPasswordFormat(password) || !Utils.checkPasswordFormat(newPassword)) throw new ErrorWebAPI(strings.passwordInvalidFormat)

    const passwordCheck = await this.connection.first("SELECT name, mail FROM users WHERE user_id = :user AND password = :pass", {
      user: this.user_id,
      pass: password
    })
    if (!passwordCheck) throw new ErrorWebAPI(strings.invalidPassword)

    await this.connection.execute("UPDATE users SET password = :pass WHERE user_id = :user", {
      pass: newPassword,
      user: this.user_id
    })

    await Utils.sendMail(passwordCheck.mail, strings.subjectPasswordChange, Utils.prepareTemplate(strings.bodyPasswordChange, {
      userName: passwordCheck.name,
      supportMail: Config.mailer.supportMail.length > 0 ? Config.mailer.supportMail : ""
    }))

    return {
      status: 200,
      result: true
    }
  }
}
