import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"

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
    const strings = await this.i18n.getStrings(this.requestData, "login-startup", "settings-index", "mailer")

    const password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    if (!Utils.checkPass(password)) throw new ErrorWebApi(strings.passwordInvalidFormat, true)
    if (!Utils.checkMail(this.params.mail)) throw new ErrorWebApi(strings.mailInvalidFormat, true)

    const userData = await this.connection.first("SELECT name, mail FROM users WHERE user_id = :user AND password = :pass", {
      user: this.user_id,
      pass: password
    })
    if (!userData) throw new ErrorWebApi(strings.invalidPassword, true)

    const mailCheck = await this.connection.first("SELECT user_id FROM users WHERE mail = :mail", {
      mail: this.params.mail
    })
    if (mailCheck) throw new ErrorWebApi(strings.emailExists, true)

    await this.connection.execute("UPDATE users SET mail = :mail WHERE user_id = :user", {
      mail: this.params.mail,
      user: this.user_id
    })

    if (!Type.isNullDef(userData.mail) && userData.mail.length > 0) {
      await Mailer.sendMail(userData.mail, strings.subjectMailChange, Utils.prepareTemplate(strings.bodyMailChange, {
        userName: userData.name,
        supportMail: Config.mailer.supportMail.length > 0 ? Config.mailer.supportMail : ""
      }))
    }

    return {
      status: 200,
      result: true
    }
  }
}
