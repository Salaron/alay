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
      mail: TYPE.STRING,
      password: TYPE.STRING
    }
  }

  public async execute() {
    const strings = await new I18n(this.connection).getStrings(this.user_id, "login-startup", "settings-index", "mailer")

    let password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    if (!Utils.checkPass(password)) throw new ErrorWebApi(strings.passwordInvalidFormat, true)
    if (!Utils.checkMail(this.params.mail)) throw new ErrorWebApi(strings.mailInvalidFormat, true)

    let passwordCheck = await this.connection.first("SELECT name, mail FROM users WHERE user_id = :user AND password = :pass", {
      user: this.user_id,
      pass: password
    })
    if (!passwordCheck) throw new ErrorWebApi(strings.invalidPassword, true)

    let mailCheck = await this.connection.first("SELECT user_id FROM users WHERE mail = :mail", {
      mail: this.params.mail
    })
    if (mailCheck) throw new ErrorWebApi(strings.emailExists, true)

    await this.connection.execute("UPDATE users SET mail = :mail WHERE user_id = :user", {
      mail: this.params.mail,
      user: this.user_id
    })

    if (passwordCheck.mail != null) {
      await Mailer.sendMail(passwordCheck.mail, strings.subjectMailChange, Utils.prepareTemplate(strings.bodyMailChange, {
        userName: passwordCheck.name,
        supportMail: Config.mailer.supportMail.length > 0 ? Config.mailer.supportMail : ""
      }))
    }
      
    return {
      status: 200,
      result: true
    }
  }
}