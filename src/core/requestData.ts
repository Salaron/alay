import { IncomingMessage, ServerResponse } from "http"
import { IncomingForm } from "formidable"
import querystring from "querystring"
import { AUTH_LEVEL, HANDLER_TYPE } from "../types/const"
import { Log } from "../core/log"
import chalk from "chalk"

const log = new Log("Request Data")

export default class RequestData {
  public user_id: number | null = null
  public auth_token: string | null = null
  public auth_level: AUTH_LEVEL = AUTH_LEVEL.NONE
  public auth_header: Authorize
  public headers: any
  public request: IncomingMessage
  public handlerType: HANDLER_TYPE
  public connection: Connection
  public formData: any
  public raw_request_data: any // JSON parse remove some symbols from fromData
  
  private auth_level_check = false
  private response: ServerResponse
  constructor(request: IncomingMessage, response: ServerResponse, formData: any, hType: HANDLER_TYPE) {
    this.headers = request.headers
    this.request = request
    this.response = response
    this.handlerType = hType

    if (this.headers.authorize) {
      this.auth_header = <any>querystring.parse(this.headers.authorize)
      if (this.auth_header.token && (<string>this.auth_header.token).match(/^[a-z0-9]{70,90}$/gi)) {
        this.auth_token = this.auth_header.token
      }
    }
    if (this.headers["user-id"]) this.user_id = parseInt(this.headers["user-id"]) || null
    if (hType === HANDLER_TYPE.WEBVIEW) {
      // for webview available additional variants: queryString and cookie
      // queryString:
      this.formData = querystring.parse(this.request.url!.split(/[?]+/)[1])
      if (this.formData.user_id && this.formData.token) {
        this.user_id = parseInt(this.formData.user_id) || null
        this.auth_token = this.formData.token
      } else { // cookie
        this.user_id = parseInt(<string>getCookie(<string>this.headers["cookie"] || "", "user_id")) || null
        this.auth_token = getCookie(<string>this.headers["cookie"] || "", "token")
      }
      if (this.user_id != null && this.auth_token != null) {
        response.setHeader("Set-Cookie", [
          `user_id=${this.user_id}; expires=${new Date(new Date().getTime() + 86409000).toUTCString()}; path=/;`,
          `token=${this.auth_token}; expires=${new Date(new Date().getTime() + 86409000).toUTCString()}; path=/;`
        ])
      }
    }

    if (formData && formData.request_data && hType === HANDLER_TYPE.MAIN) {
      try {
        this.raw_request_data = formData.request_data
        this.formData = JSON.parse(formData.request_data)
        this.formData.precise_score_log = undefined // Remove it for now
        let url = <string>this.request.url
        log.info(chalk["bgWhite"](chalk["black"]((url))) + " " + JSON.stringify(this.formData), "User #" + this.user_id)
      } catch (e) {
        log.error(e)
        this.auth_level = AUTH_LEVEL.REJECTED
      }
    }
  }
  static async Create(request: IncomingMessage, response: ServerResponse, type: HANDLER_TYPE) {
    let formData = await formidableParseAsync(request)
    let rd = new RequestData(request, response, formData, type)
    rd.connection = await MySQLconnection.get()
    return rd
  }

  public async getAuthLevel() {
    if (this.auth_level_check) return this.auth_level
    this.auth_level_check = true
    // TODO additional checks

    if (this.user_id === null && this.auth_token === null) {
      // Auth key step
      log.debug(this.headers, "Request Headers")
      return this.auth_level = AUTH_LEVEL.NONE
    }

    if (this.user_id === null && this.auth_level != null) {
      // Has token but not user id: PreLogin
      let checkToken = await this.connection.first(`SELECT * FROM auth_tokens WHERE token = :token`, { token: this.auth_level })
      if (!checkToken) return this.auth_level = AUTH_LEVEL.REJECTED // Token doesn't exist
      if (checkToken.expire < Utils.parseDate(Date.now())) return this.auth_level = AUTH_LEVEL.REJECTED // Token expired

      return this.auth_level = AUTH_LEVEL.PRE_LOGIN
    }

    if (this.user_id != null && this.auth_level != null) {
      // Has token and user id: Logged In
      let check = await this.connection.first(`SELECT last_activity FROM user_login WHERE user_id = :user AND login_token = :token`, {
        user: this.user_id,
        token: this.auth_token
      })
      if (!check) return this.auth_level = AUTH_LEVEL.REJECTED // token is no longer valid

      // TODO: session expiration
      // TODO: client update version level
      if (Config.server.admin_ids.includes(this.user_id)) return this.auth_level = AUTH_LEVEL.ADMIN
      else return this.auth_level = AUTH_LEVEL.CONFIRMED_USER
    }
  }
  public async checkXMC(useSpecialKey = false) {
    if (Config.server.XMC_check === false) return true // xmc check force disabled

    let xmc = ""
    if (useSpecialKey) {
      xmc = Utils.hmacSHA1(this.raw_request_data, Config.specialKey)
    } else if (this.auth_level === AUTH_LEVEL.PRE_LOGIN) {
      let key = await this.connection.first(`SELECT session_key FROM auth_tokens WHERE token = :token`, { token: this.auth_level })
      if (!key) return false
      xmc = Utils.hmacSHA1(this.raw_request_data, key.session_key)
    } else if (this.auth_level >= AUTH_LEVEL.CONFIRMED_USER) {
      let key = await this.connection.first(`SELECT session_key FROM user_login WHERE user_id = :user AND login_token = :token`, {
        user: this.user_id,
        token: this.auth_level
      })
      if (!key) return false
      return xmc = Utils.hmacSHA1(this.raw_request_data, key.session_key)
    }

    return xmc === this.headers["x-message-code"]
  }
}

async function formidableParseAsync(request: IncomingMessage): Promise<any> {
  return new Promise((res, rej) => {
    let form = new IncomingForm()
    form.parse(request, (err, fields) => {
      if (err) return rej(err)
      res(fields)
    })
  })
}
function getCookie(cheader: string, cname: string) {
  let name = cname + "="
  let cArray = cheader.split(";")
  for(let i = 0; i < cArray.length; i++) {
    let c = cArray[i]
    while (c.charAt(0) == " ") {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return null
}
