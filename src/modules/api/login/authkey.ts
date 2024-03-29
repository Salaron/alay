import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Logger } from "../../../core/logger"
import crypto from "crypto"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"

const log = new Logger("Authkey")

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      dummy_token: TYPE.STRING,
      auth_data: TYPE.STRING
    }
  }

  public paramCheck() {
    return true
  }

  public async execute() {
    if (this.requestData.auth_level != this.requiredAuthLevel) throw new Error(`You're already logged in`)
    const trick = {
      status: 200,
      result: {
        authorize_token: Utils.randomString(80 + Math.floor(Math.random() * 10)),
        dummy_token: crypto.randomBytes(32).toString("base64")
      }
    }

    try {
      const serverKey = crypto.randomBytes(32).toString("base64")
      const clientKey = Utils.RSADecrypt(this.params.dummy_token)
      const sessionKey = Utils.xor(Buffer.from(clientKey, "base64"), Buffer.from(serverKey, "base64")).toString("base64") // Generate session key by XORing client and server keys
      const authData = JSON.parse(Utils.AESDecrypt(Buffer.from(clientKey, "base64").slice(0, 16), this.params.auth_data)) // device info

      const xorBase = Utils.xor(Buffer.from(Config.client.XMC_base), Buffer.from(Config.client.application_key))
      const signKey = Utils.xor(xorBase, Buffer.from(clientKey, "base64"))
      const xmcStatus = this.requestData.checkXMessageCode(false, signKey)

      const xmcVerifyEnabled = this.requestData.auth_level === AUTH_LEVEL.NONE && Config.server.XMC_check === true
      if (!xmcStatus && xmcVerifyEnabled) { // do the trick if it's incorrect
        return trick
      }

      const loginKey = authData[1]
      const loginPaswd = authData[2]
      if (authData[1] && authData[2] && authData[3]) {
        if (
          (typeof loginKey != "string") ||
          (typeof loginPaswd != "string") ||
          (loginKey.length != 36) ||
          (loginPaswd.length != 128) ||
          (!loginKey.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi)) ||
          (!loginPaswd.match(/^[0-9A-Z]{128}/gi))
        ) return trick

        let id = await this.connection.first("SELECT user_id FROM user_login WHERE login_key=:key AND login_passwd=:pass", {
          key: authData[1],
          pass: authData[2]
        })
        if (!id) id = { user_id: 0 }

        const assertation = JSON.parse(Buffer.from(authData[3], "base64").toString()) // check if it is correct JSON

        if (Config.modules.login.auth_logging) {
          await this.connection.query(`INSERT INTO auth_log(user_id, application_version, client_version, ip, device_info) VALUES (:user, :app_ver, :cl_ver, :ip, :device_info)`, {
            user: id.user_id,
            app_ver: this.requestData.headers["bundle-version"],
            cl_ver: this.requestData.headers["client-version"],
            ip: Utils.getRemoteAddress(this.requestData.request),
            device_info: JSON.stringify(assertation)
          })
        }
      } else return trick

      const token = Utils.randomString(80 + Math.floor(Math.random() * 10))
      await this.connection.query("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd, language) VALUES (:token, DATE_ADD(NOW(), INTERVAL 30 MINUTE), :sk, :lk, :lp, 'ru')", {
        token,
        sk: sessionKey,
        lk: loginKey,
        lp: loginPaswd
      })

      return {
        status: 200,
        result: {
          authorize_token: token,
          dummy_token: serverKey
        }
      }
    } catch (err) {
      log.error(err)
      return trick
    }
  }

}
