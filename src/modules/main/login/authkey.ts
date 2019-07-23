import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import { Log } from "../../../core/log"
import crypto from "crypto"

const log = new Log("Authkey")

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  private user_id: number | null
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
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
    if (this.requestData.auth_level > AUTH_LEVEL.UPDATE) throw new Error(`You're already logged in`)
    const trick = {
      status: 200, 
      result: {
        authorize_token: Utils.randomString(80 + Math.floor(Math.random() * 10)),
        dummy_token: crypto.randomBytes(32).toString("base64")
      }
    }

    try {
      let serverKey = crypto.randomBytes(32).toString("base64")
      let clientKey = Utils.RSADecrypt(this.formData.dummy_token)
      let sessionKey = Utils.xor(Buffer.from(clientKey, "base64"), Buffer.from(serverKey, "base64")).toString("base64") // Generate session key by XORing client and server keys
      let authData = JSON.parse(Utils.AESDecrypt(Buffer.from(clientKey, "base64").slice(0, 16), this.formData.auth_data)) // device info

      let divineKey = Utils.xor(Buffer.from(Config.client.XMC_base), Buffer.from(Config.client.application_key))
      divineKey = Utils.xor(divineKey, Buffer.from(clientKey, "base64"))
      let xmc = Utils.hmacSHA1(this.requestData.raw_request_data, divineKey)

      let xmcVerifyEnabled = this.requestData.auth_level === AUTH_LEVEL.NONE && Config.server.XMC_check === true
      if (xmc != this.requestData.headers["x-message-code"] && xmcVerifyEnabled) { // do the trick if it's incorrect 
        return trick
      }

      let loginKey = authData[1]
      let loginPaswd = authData[2]
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

        let assertation = JSON.parse(Buffer.from(authData[3], "base64").toString()) // check if it is correct JSON

        if (Config.modules.auth.auth_logging) {
          await this.connection.query(`INSERT INTO auth_log(user_id, application_version, client_version, ip, device_info) VALUES (:user, :app_ver, :cl_ver, :ip, :device_info)`, {
            user: id.user_id,
            app_ver: this.requestData.headers["bundle-version"],
            cl_ver: this.requestData.headers["client-version"],
            ip: this.requestData.request.connection.remoteAddress,
            device_info: JSON.stringify(assertation)
          })
        }
      } else return trick

      let token = Utils.randomString(80 + Math.floor(Math.random() * 10))
      await this.connection.query("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd) VALUES (:token, :expire, :sk, :lk, :lp)", {
        token: token,
        expire: Utils.parseDate(Date.now() + 15000),
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