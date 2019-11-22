import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import { Mailer } from "../../../core/mailer"
import moment from "moment"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramTypes() {
    return {
      handover_code: TYPE.STRING,
      handover_id: TYPE.STRING
    }
  }
  public paramCheck() {
    if (this.params.handover_code.length != 40) throw new ErrorCode(4407)
  }

  public async execute() {
    let transferUserData = await this.connection.first(`SELECT name, user_id, password, mail, language FROM users WHERE user_id=:user`, {
      user: this.params.handover_id
    })
    if (!transferUserData) throw new ErrorCode(4407) // Invalid id
    if (this.user_id === transferUserData.user_id) throw new ErrorCode(4407) // trying to their id

    let hashUser = Utils.hashSHA1(transferUserData.user_id).toUpperCase()
    let hash = Utils.hashSHA1(hashUser + transferUserData.password).toUpperCase()
    if (hash != this.params.handover_code) throw new ErrorCode(4407) // invalid code
    const i18n = await this.i18n.getStrings(transferUserData.language, "mailer")

    let userCred = await this.connection.first(`SELECT login_key, login_passwd FROM user_login WHERE user_id = :user`, {
      user: this.user_id
    })
    await this.connection.query(`UPDATE user_login SET login_key = null, login_passwd = null, login_token = null WHERE user_id = :user`, {
      user: this.user_id
    })
    await this.connection.query(`INSERT INTO user_login (user_id, login_key, login_passwd) VALUES (:user, :key, :pass) ON DUPLICATE KEY UPDATE login_key = :key, login_passwd = :pass`, {
      key: userCred.login_key,
      pass: userCred.login_passwd,
      user: transferUserData.user_id
    })

    await Mailer.getInstance().sendMail(transferUserData.mail, i18n.subjectNewLogin, Utils.prepareTemplate(i18n.bodyNewLogin, {
      userName: transferUserData.name,
      ip: Utils.getRemoteAddress(this.requestData.request),
      date: moment().format("YYYY.MM.DD HH:mm Z"),
      device: this.requestData.headers["os-version"]
    }))

    return {
      status: 200,
      result: []
    }
  }
}
