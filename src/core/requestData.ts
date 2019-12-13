// tslint:disable:variable-name
import chalk from "chalk"
import { IncomingForm } from "formidable"
import { IncomingMessage, ServerResponse } from "http"
import moment from "moment"
import querystring from "querystring"
import { Utils } from "../common/utils"
import { Logger } from "./logger"
import { AUTH_LEVEL, HANDLER_TYPE } from "../models/constant"
import { Connection } from "./database/mariadb"

const log = new Logger("Request Data")

interface authLevelOptions {
  force?: boolean
}
export interface Authorize {
  consumerKey: string
  timeStamp: number
  version: string
  nonce: string | number
  token?: string
  requestTimeStamp?: number
}

export default class RequestData {
  public user_id: number | null = null
  public auth_token: string | null = null
  public params: any = null
  public auth_level: AUTH_LEVEL = AUTH_LEVEL.NONE
  public auth_header: Authorize
  public headers: any
  public request: IncomingMessage
  public handlerType: HANDLER_TYPE
  public connection: Connection
  public raw_request_data: any // JSON.parse can make XMC calculation wrong
  public requestFromBrowser = false
  public response: ServerResponse

  private auth_level_check_passed = false
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
      this.params = querystring.parse(this.request.url!.split(/[?]+/)[1])
      if (this.user_id === null && this.auth_token === null) {
        // for webview available additional variants: queryString and cookie
        if (Type.isString(this.params.user_id) && Type.isString(this.params.token)) { // queryString
          this.user_id = parseInt(this.params.user_id) || null
          this.auth_token = this.params.token
          if (!Config.server.debug_mode) this.requestFromBrowser = true
        } else if (
          getCookie(<string>this.headers.cookie || "", "token") != null
        ) { // cookie
          if (!isNaN(parseInt(<string>getCookie(<string>this.headers.cookie || "", "user_id")))) {
            this.user_id = parseInt(<string>getCookie(<string>this.headers.cookie || "", "user_id"))
          }
          this.auth_token = getCookie(<string>this.headers.cookie || "", "token")
          if (!Config.server.debug_mode) this.requestFromBrowser = true
        }
      }
      if (this.user_id != null && this.auth_token != null) {
        response.setHeader("Set-Cookie", [
          `user_id=${this.user_id}; expires=${new Date(new Date().getTime() + Config.modules.user.userSessionExpire * 1000).toUTCString()}; path=/; SameSite=Strict;`,
          `token=${this.auth_token}; expires=${new Date(new Date().getTime() + Config.modules.user.userSessionExpire * 1000).toUTCString()}; path=/; SameSite=Strict;`
        ])
      }
      if (
        !this.headers["x-requested-with"] ||
        !this.headers["application-id"] ||
        !this.headers["os"] ||
        !this.headers["os-version"]
      ) this.requestFromBrowser = true
    }

    if (formData && formData.request_data && hType === HANDLER_TYPE.API) {
      try {
        this.raw_request_data = formData.request_data
        this.params = JSON.parse(formData.request_data)
        this.params.precise_score_log = undefined // Remove it for now
      } catch (e) {
        log.error(e)
        this.auth_level = AUTH_LEVEL.REJECTED
      }
    }
    if (formData && hType === HANDLER_TYPE.WEBAPI) this.params = formData

    const url = <string>this.request.url!.split(/[?]+/)[0]
    if (this.params != null && Object.keys(this.params).length > 0) {
      log.info(chalk.bgWhite(chalk.black((url))) + " " + JSON.stringify(this.params), "User #" + this.user_id)
    } else {
      log.info(chalk.bgWhite(chalk.black((url))), "User #" + this.user_id)
    }
  }
  public static async Create(request: IncomingMessage, response: ServerResponse, type: HANDLER_TYPE) {
    const formData = await formidableParseAsync(request)
    const rd = new RequestData(request, response, formData, type)
    rd.connection = await Connection.beginTransaction()
    return rd
  }

  public async getAuthLevel(options: authLevelOptions = {}) {
    if (this.auth_level_check_passed && !options.force) return this.auth_level
    this.auth_level_check_passed = true
    // TODO additional checks

    if (this.user_id === null && this.auth_token === null) {
      // Auth key step
      log.debug(JSON.stringify(this.headers, null, 2), "Request Headers")
      return this.auth_level = AUTH_LEVEL.NONE
    }

    if (this.user_id === null && this.auth_token != null) {
      // Has token but not user id: PreLogin
      const checkToken = await this.connection.first(`SELECT * FROM auth_tokens WHERE token = :token`, {
        token: this.auth_token
      })
      if (!checkToken) return this.auth_level = AUTH_LEVEL.REJECTED // Token doesn't exist
      if (checkToken.expire < Utils.parseDate(Date.now())) return this.auth_level = AUTH_LEVEL.REJECTED // Token expired

      return this.auth_level = AUTH_LEVEL.PRE_LOGIN
    }

    if (this.user_id != null && this.auth_token != null) {
      // Has token and user id: Logged In
      const check = await this.connection.first(`SELECT last_activity FROM user_login WHERE user_id = :user AND login_token = :token`, {
        user: this.user_id,
        token: this.auth_token
      })
      if (!check) return this.auth_level = AUTH_LEVEL.REJECTED // token is no longer valid
      const banCheck = await this.connection.first("SELECT * FROM user_banned WHERE user_id = :user", {
        user: this.user_id
      })
      if (banCheck) {
        if (banCheck.expiration_date && moment().diff(banCheck.expiration_date, "second") < 0 || !banCheck.expiration_date) {
          return this.auth_level = AUTH_LEVEL.BANNED
        }
      }

      if (moment().diff(check.last_activity, "second") >= Config.modules.user.userSessionExpire) return this.auth_level = AUTH_LEVEL.SESSION_EXPIRED
      if (!this.requestFromBrowser && Utils.versionCompare(<string>this.request.headers["client-version"] || "0.0", Config.server.server_version) === -1) return this.auth_level = AUTH_LEVEL.UPDATE

      await this.connection.execute("UPDATE user_login SET last_activity = CURRENT_TIMESTAMP WHERE user_id = :user AND login_token = :token", {
        user: this.user_id,
        token: this.auth_token
      })
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
      const key = await this.connection.first(`SELECT session_key FROM auth_tokens WHERE token = :token`, { token: this.auth_token })
      if (!key) return false
      xmc = Utils.hmacSHA1(this.raw_request_data, key.session_key)
    } else if (this.auth_level >= AUTH_LEVEL.CONFIRMED_USER) {
      const key = await this.connection.first(`SELECT session_key FROM user_login WHERE user_id = :user AND login_token = :token`, {
        user: this.user_id,
        token: this.auth_token
      })
      if (!key) return false
      xmc = Utils.hmacSHA1(this.raw_request_data, key.session_key)
    }

    return xmc === this.headers["x-message-code"]
  }

  public getWebapiHeaders() {
    const authorizeHeader = {
      consumerKey: Config.client.consumer_key.length > 0 ? Config.client.consumer_key : "lovelive_test",
      timeStamp: Utils.timeStamp(),
      version: "1.1",
      nonce: "WA0",
      token: this.auth_token || ""
    }
    const headers = {
      "user-id": this.user_id ? this.user_id.toString() : "",
      "bundle-version": this.headers["bundle-version"] || Config.client.application_version,
      "client-version": this.headers["client-version"] || Config.server.server_version,
      "application-id": this.headers["application-id"] || Config.client.application_id,
      "os-version": this.request.headers["os-version"],
      "authorize": querystring.stringify(authorizeHeader)
    }
    return headers
  }

  public resetCookieAuth() {
    this.response.setHeader("Set-Cookie", [
      `user_id=; expires=${new Date(new Date().getTime() - 600000).toUTCString()}; path=/;`,
      `token=; expires=${new Date(new Date().getTime() - 600000).toUTCString()}; path=/;`
    ])
  }
}

async function formidableParseAsync(request: IncomingMessage): Promise<any> {
  return new Promise((res, rej) => {
    const form = new IncomingForm()
    form.parse(request, (err, fields) => {
      if (err) return rej(err)
      res(fields)
    })
  })
}
function getCookie(cheader: string, cname: string) {
  const name = cname + "="
  const cArray = cheader.split(";")
  for (let c of cArray) {
    while (c.charAt(0) == " ") {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return null
}
