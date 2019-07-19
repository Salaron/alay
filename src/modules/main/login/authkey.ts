import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import crypto from "crypto"

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

    let serverKey = crypto.randomBytes(32).toString("base64")
    let clientKey = Utils.RSADecrypt(this.formData.dummy_token)
    let sessionKey = Utils.xor(Buffer.from(clientKey, "base64"), Buffer.from(serverKey, "base64")).toString("base64") // Generate session key by XORing client and server keys
    // let authData = JSON.parse(Utils.AESDecrypt(Buffer.from(clientKey, "base64").slice(0, 16), this.formData.auth_data)) // device info

    let token = Utils.randomString(80 + Math.floor(Math.random() * 10))
    await this.connection.query("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd) VALUES (:token, :expire, :sk, :lk, :lp)", {
      token: token,
      expire: Utils.parseDate(Date.now() + 15000),
      sk: sessionKey,
      lk: "null",
      lp: "null"
    })

    return {
      status: 200,
      result: {
        authorize_token: token,
        dummy_token: serverKey
      }
    }
  }
}