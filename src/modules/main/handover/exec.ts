import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"

export default class extends MainAction {
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
    let data = await this.connection.first(`SELECT user_id, password FROM users WHERE user_id=:user`, {
      user: this.params.handover_id
    })
    if (!data) throw new ErrorCode(4407) // Invalid id
    if (this.user_id === data.user_id) throw new ErrorCode(4407) // trying to their id

    let hashUser = Utils.hashSHA1(data.user_id).toUpperCase()
    let hash = Utils.hashSHA1(hashUser + data.password).toUpperCase()
    if (hash != this.params.handover_code) throw new ErrorCode(4407) // invalid code

    let userCred = await this.connection.first(`SELECT login_key, login_passwd FROM user_login WHERE user_id=:user`, {
      user: this.user_id
    })
    await this.connection.query(`UPDATE user_login SET login_key = null, login_passwd = null, login_token = null WHERE user_id = :user`, {
      user: this.user_id
    })
    await this.connection.query(`INSERT INTO user_login (user_id, login_key, login_passwd) VALUES (:user, :key, :pass) ON DUPLICATE KEY UPDATE login_key = :key, login_passwd = :pass`, {
      key: userCred.login_key,
      pass: userCred.login_passwd,
      user: data.user_id
    })

    return {
      status: 200,
      result: []
    }
  }
}