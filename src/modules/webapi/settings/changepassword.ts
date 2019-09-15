import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"
import { I18n } from "../../../common/i18n"
import { Utils } from "../../../common/utils"

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
    const strings = await new I18n(this.connection).getStrings(this.user_id, "login-startup", "settings-index", "mailer")

    const password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    const newPassword = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.newPassword), "base64").toString(), this.requestData.auth_token).toString()
    if (!Utils.checkPass(password) || !Utils.checkPass(newPassword)) throw new ErrorWebApi(strings.passwordInvalidFormat, true)

    const passwordCheck = await this.connection.first("SELECT name, mail FROM users WHERE user_id = :user AND password = :pass", {
      user: this.user_id,
      pass: password
    })
    if (!passwordCheck) throw new ErrorWebApi(strings.invalidPassword, true)

    await this.connection.execute("UPDATE users SET password = :pass WHERE user_id = :user", {
      pass: newPassword,
      user: this.user_id
    })

    await Mailer.sendMail(passwordCheck.mail, strings.subjectPasswordChange, Utils.prepareTemplate(strings.bodyPasswordChange, {
      userName: passwordCheck.name,
      supportMail: Config.mailer.supportMail.length > 0 ? Config.mailer.supportMail : ""
    }))

    return {
      status: 200,
      result: true
    }
  }
}
