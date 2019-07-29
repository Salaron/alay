import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.PRE_LOGIN

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes() {
    return {
      user_id: TYPE.STRING,
      password: TYPE.STRING
    }
  }
  public async execute() {
    let decrypted = Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString()
    this.user_id = parseInt(Buffer.from(Utils.RSADecrypt(this.params.user_id), "base64").toString())
    let pass = Utils.xor(decrypted, this.requestData.auth_token).toString()

    if (!checkUser(this.user_id)) throw new Error(`User ID is not integer`)
    if (!checkPass(pass)) throw new Error(`Used forbidden characters`)
    
    let data = await this.connection.first(`SELECT * FROM users WHERE user_id = :user AND password = :pass`, {
      user: this.user_id,
      pass: pass
    })
    if (!data) return {
      status: 600,
      result: {
        message: "Invalid User ID / Password"
      }
    }

    let cred = await this.connection.first(`SELECT * FROM auth_tokens WHERE token = :token`, {
      token: this.requestData.auth_token
    })
    if (!cred) throw new Error(`Token is expired?`)
    // check if this credentials already used
    let check = await this.connection.first(`SELECT * FROM user_login WHERE login_key = :key AND login_passwd = :pass`, {
      key: cred.login_key,
      pass: cred.login_passwd
    }) 
    if (check) throw new Error(`This credentials already used`)

    await this.connection.query(`INSERT INTO user_login (user_id, login_key, login_passwd) VALUES (:user, :key, :pass) ON DUPLICATE KEY UPDATE login_key = :key, login_passwd = :pass`, {
      key: cred.login_key,
      pass: cred.login_passwd,
      user: this.user_id
    })
    
    // Destroy current token
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: this.requestData.auth_token })
    return {
      status: 200,
      result: true
    }
  }
}
function checkPass(input: any) {
  return input.match(/^[A-Za-z0-9]\w{1,16}$/)
}
function checkUser(input: any) {
  return (
    input.toString().match(/^[0-9]\w{0,10}$/) &&
    parseInt(input) === parseInt(input) &&
    parseInt(input) > 0
  )
}