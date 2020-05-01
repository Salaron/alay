// tslint:disable:variable-name
import chalk from "chalk"
import { IncomingForm } from "formidable"
import { IncomingMessage, ServerResponse } from "http"
import moment from "moment"
import querystring from "querystring"
import { Utils } from "../common/utils"
import { AuthToken } from "../models/authToken"
import { AUTH_LEVEL, HANDLER_TYPE } from "../models/constant"
import { Connection } from "./database/mysql"
import { Logger } from "./logger"

const log = new Logger("Request Data")

interface authLevelOptions {
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
  public static async Create(request: IncomingMessage, response: ServerResponse, type: HANDLER_TYPE) {
    const formData = await this.parseFormData(request)
    const rd = new RequestData(request, response, formData, type)
    rd.connection = await Connection.beginTransaction()
    await rd.updateAuthLevel()
    return rd
  }

  private static async parseFormData(request: IncomingMessage): Promise<any> {
    return new Promise((res, rej) => {
      const form = new IncomingForm()
      form.parse(request, (err, fields) => {
        if (err) return rej(err)
        res(fields)
      })
    })
  }

  public user_id: number = 0
  public auth_token: string = ""
  public params: any = null
  public auth_level: AUTH_LEVEL = AUTH_LEVEL.NONE
  public auth_header: Authorize
  public headers: any
  public request: IncomingMessage
  public handlerType: HANDLER_TYPE
  public connection: Connection
  public requestFromBrowser = false
  public response: ServerResponse

  private raw_request_data: any // JSON.parse can make XMC calculation wrong
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
    if (this.headers["user-id"]) this.user_id = parseInt(this.headers["user-id"]) || 0

    if (hType === HANDLER_TYPE.WEBVIEW) {
      this.params = querystring.parse(this.request.url!.split(/[?]+/)[1])

      if (this.user_id === 0 && this.auth_token === "") {
        // for webview available additional variants: queryString and cookie
        if (Type.isString(this.params.user_id) && Type.isString(this.params.token)) {
          // queryString
          this.user_id = parseInt(this.params.user_id) || 0
          this.auth_token = this.params.token
        } else if (this.getCookie("token") !== null) {
          // cookie
          const userId = this.getCookie("user_id")
          if (userId !== null) {
            this.user_id = parseInt(userId)
          }
          this.auth_token = this.getCookie("token")!
        }
      }
      if (this.user_id !== 0 && this.auth_token !== "") {
        // renewal session
        response.setHeader("Set-Cookie", [
          Utils.getCookieHeader("user_id", this.user_id, 23),
          Utils.getCookieHeader("token", this.auth_token, 23)
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

  public async updateAuthLevel(options: authLevelOptions = {}) {
    // TODO additional checks

    if (this.user_id === 0 && this.auth_token === "") {
      // Auth key
      log.debug(JSON.stringify(this.headers, null, 2), "Request Headers")
      return this.auth_level = AUTH_LEVEL.NONE
    }

    if (this.user_id === 0 && this.auth_token !== "") {
      // Has token but not user id: PreLogin
      const authToken = new AuthToken(this.auth_token)
      const tokenData = await authToken.get()
      if (!tokenData) return this.auth_level = AUTH_LEVEL.REJECTED
      return this.auth_level = AUTH_LEVEL.PRE_LOGIN
    }

    if (this.user_id !== 0 && this.auth_token !== "") {
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
      if (Config.server.admin_ids.includes(this.user_id))
        return this.auth_level = AUTH_LEVEL.ADMIN
      else
        return this.auth_level = AUTH_LEVEL.CONFIRMED_USER
    }
  }
  public async checkXMessageCode(useSpecialKey = false, customKey?: Buffer) {
    if (Config.server.XMC_check === false) return true // xmc check force disabled

    let xmc = ""
    if (useSpecialKey) {
      xmc = Utils.hmacSHA1(this.raw_request_data, Config.specialKey)
    } else if (this.auth_level === AUTH_LEVEL.NONE && customKey) {
      xmc = Utils.hmacSHA1(this.raw_request_data, customKey)
    } else if (this.auth_level === AUTH_LEVEL.PRE_LOGIN) {
      const authToken = new AuthToken(this.auth_token)
      if (!authToken.sessionKey) return false
      xmc = Utils.hmacSHA1(this.raw_request_data, authToken.sessionKey)
    } else if (this.auth_level >= AUTH_LEVEL.UPDATE) {
      const key = await this.connection.first(`SELECT session_key FROM user_login WHERE user_id = :user AND login_token = :token`, {
        user: this.user_id,
        token: this.auth_token
      })
      if (!key) return false
      xmc = Utils.hmacSHA1(this.raw_request_data, key.session_key)
    }

    return xmc === this.headers["x-message-code"]
  }

  public resetCookieAuth() {
    this.response.setHeader("Set-Cookie", [
      Utils.getCookieHeader("user_id", "", -1),
      Utils.getCookieHeader("token", "", -1)
    ])
  }

  public getCookie(name: string): string | null {
    const value = `; ${this.headers.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()!.split(";").shift()!
    return null
  }
}
