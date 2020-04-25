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
      mail: TYPE.STRING
    }
  }

  public async execute() {
    const i18n = await this.i18n.getStrings("login-startup", "settings-index", "mailer")

    if (!Utils.checkMailFormat(this.params.mail)) throw new ErrorWebAPI(i18n.mailIncorrect)

    const userData = await this.connection.first("SELECT name, mail FROM users WHERE user_id = :user", {
      user: this.user_id
    })
    if (!userData) throw new ErrorWebAPI(i18n.invalidPassword)

    const mailCheck = await this.connection.first("SELECT user_id FROM users WHERE mail = :mail", {
      mail: this.params.mail
    })
    if (mailCheck) throw new ErrorWebAPI(i18n.emailExists)

    await this.connection.execute("UPDATE users SET mail = :mail WHERE user_id = :user", {
      mail: this.params.mail,
      user: this.user_id
    })

    if (!Type.isNullDef(userData.mail) && userData.mail.length > 0) {
      await Utils.sendMail(userData.mail, i18n.mailChange.subject, Utils.prepareTemplate(i18n.mailChange.body, {
        userName: userData.name,
        supportMail: Config.mailer.supportMail.length > 0 ? Config.mailer.supportMail : ""
      }))
    }

    return {
      status: 200,
      result: []
    }
  }
}
