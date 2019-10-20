// tslint:disable:variable-name prefer-for-of
import crypto from "crypto"
import extend from "extend"
import * as fs from "fs"
import { IncomingHttpHeaders, request, RequestOptions } from "http"
import querystring from "querystring"
import { promisify } from "util"
import { gunzip } from "zlib"
import { Log } from "./log"

// Welcome to my hooorrible coding style...
/*
  ───▐▀▄──────▄▀▌───▄▄▄▄▄▄▄─────────────
  ───▌▒▒▀▄▄▄▄▀▒▒▐▄▀▀▒██▒██▒▀▀▄──────────
  ──▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▀▄────────
  ──▌▒▒▒▒▒▒▒▒▒▒▒▒▒▄▒▒▒▒▒▒▒▒▒▒▒▒▒▀▄──────
  ▀█▒▒█▌▒▒█▒▒▐█▒▒▀▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▌─────
  ▀▌▒▒▒▒▒▀▒▀▒▒▒▒▒▀▀▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▐───▄▄
  ▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▌▄█▒█
  ▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▐▒█▀─
  ▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▐▀───
  ▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▌────
  ─▌▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▐─────
  ─▐▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▌─────
  ──▌▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▐──────
  ──▐▄▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▄▌──────
  ────▀▄▄▀▀▀▀▄▄▀▀▀▀▀▀▄▄▀▀▀▀▀▀▄▄▀────────
*/

interface IResponse {
  body: string
  headers: IncomingHttpHeaders
  statusCode: number | undefined
}
interface IAPIResponse {
  response_data: any
  release_info?: any[]
  status_code: number
  message?: string // permission error / error on the server-side
}
interface IAPIResponseError {
  response_data: {
    code?: number
    error_code?: number
    message: string
  }
  message?: string
  status_code?: number
}

interface requestOptions extends RequestOptions {
  body: string
}
interface APIsingleRequestOptions {
  module?: string
  action?: string
  formData?: any
  additional: Array<"commandNum" | "timeStamp" | "mgd">
  specialPoint?: boolean
  url?: string
}
interface createAccountOptions {
  loginKey?: string
  loginPasswd?: string
  host?: string
  applicationKey?: string
  baseKey?: string
  clientVersion?: string
  bundleVersion?: string
  logLevel?: number
  logger?: Log
  pubKeyPath?: string
  publicKey?: crypto.KeyLike
}
interface loginOptions extends createAccountOptions {
  loginKey: string
  loginPasswd: string
}

class LoveLiveClientError extends Error {
  public error_code: number | undefined
  public server_message: string | undefined
  public status_code: number | undefined
  constructor(response: IAPIResponseError) {
    let message = response.response_data.message
    let error_code = response.response_data.error_code || response.response_data.code
    let status_code = response.status_code
    if (typeof message === "string" && typeof error_code === "number") super(`Server returned message: ${message} with error_code: ${error_code} and status_code: ${response.status_code}`)
    else if (typeof message === "string") super(`Server returned message: '${message}' with status_code: ${response.status_code}`)
    else if (typeof error_code === "number") super(`Server returned error_code: ${error_code} with status_code: ${response.status_code}`)
    else super(`Server returned json with status_code: ${response.status_code}`)
    this.server_message = message
    this.error_code = error_code
    this.status_code = status_code

    this.checkSIFerror()
  }

  public checkSIFerror(): void {
    if (this.error_code == 407) this.message = `Server returned error_code: "Invalid credentials"`
  }
}

export default class llclient {
  public host: string
  public token: string | undefined
  public mdg = 2 // Aqours
  public nonce = 0
  public commandNum = 0
  public user_id: number | undefined
  public headers: any = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip,deflate",
    "API-Model": "straightforward",
    "Debug": "1",
    "Bundle-Version": "6.8",
    "Client-Version": "40.1",
    "OS-Version": "Pixel 2 XL taimen 8.1.0",
    "OS": "Android", // or iOS
    "Platform-Type": "2", // 1 for iOS
    "Application-ID": "626776655",
    "Time-Zone": "JST",
    "Region": "392",
    "X-HTTP-BUNDLE-ID": "klb.android.lovelive",
    "Connection": "keep-alive"
  }
  public defaultNames = [
    "真面目な学院生", "明るい学院生", "心優しい学院生", "アイドル好きの学院生", "期待の学院生", "頼りになる学院生",
    "素直な学院生", "さすらいの学院生", "気になる学院生", "憧れの学院生", "元気な学院生", "勇敢な学院生", "さわやかな学院生",
    "幻の学院生", "天然な学院生", "癒し系な学院生", "純粋な学院生", "正義感あふれる学院生", "カラオケ好きの学院生", "不思議な学院生"
  ]
  public log: Log

  private pubKeyPath = "./public.pem"
  private rsaKey: crypto.KeyLike | undefined
  private _applicationKey = ""
  private _baseKey = ""
  private specialKey: Buffer
  private signKey: Buffer | string = ""
  private loginKey = ""
  private port = 80

  // temporary
  private clientKey: Buffer | string = ""
  private serverKey: string = ""

  // update sp key if appKey or baseKey has changed
  set applicationKey(value: string) {
    this._applicationKey = value
    this.specialKey = Buffer.concat([this.XOR(this._applicationKey.slice(0, 16), this._baseKey.slice(16, 32)), this.XOR(this._applicationKey.slice(16, 32), this._baseKey.slice(0, 16))])
  }
  set baseKey(value: string) {
    this._baseKey = value
    this.specialKey = Buffer.concat([this.XOR(this._applicationKey.slice(0, 16), this._baseKey.slice(16, 32)), this.XOR(this._applicationKey.slice(16, 32), this._baseKey.slice(0, 16))])
  }

  constructor(host = "prod-jp.lovelive.ge.klabgames.net", options: loginOptions) {
    if (options.logger) this.log = options.logger
    else this.log = new Log("emu")

    this.host = host
    if (this.host.split("/").includes("https:")) { // shrug
      this.port = 443
      this.host = this.host.replace("https://", "")
    }
    if (this.host.split("/").includes("http:")) {
      this.port = 80
      this.host = this.host.replace("http://", "")
    }
    if (typeof options.applicationKey === "string") this._applicationKey = options.applicationKey
    if (typeof options.baseKey === "string") this._baseKey = options.baseKey
    if (typeof options.pubKeyPath === "string") this.pubKeyPath = options.pubKeyPath
    if (typeof options.publicKey === "string") this.rsaKey = options.publicKey

    if (typeof options.bundleVersion != "undefined") this.headers["Bundle-Version"] = options.bundleVersion.toString()
    if (typeof options.clientVersion != "undefined") this.headers["Client-Version"] = options.clientVersion.toString()
    this.specialKey = Buffer.concat([this.XOR(this._applicationKey.slice(0, 16), this._baseKey.slice(16, 32)), this.XOR(this._applicationKey.slice(16, 32), this._baseKey.slice(0, 16))])
  }

  public static async authKey(params: loginOptions): Promise<llclient> {
    let client = new llclient(params.host, params)

    if (!params.publicKey) client.rsaKey = await promisify(fs.readFile)(client.pubKeyPath, "utf-8")
    client.loginKey = params.loginKey

    const authData = JSON.stringify({
      1: params.loginKey,
      2: params.loginPasswd,
      3: Buffer.from(JSON.stringify({
        "GreatStockOption": "",
        "Hardware": "NOT_FOUND",
        "adbEnbled": "NO",
        "basePath": "/data/user/0/klb.android.lovelive/files",
        "d2lic35kBQ==": "cISEeEJPT0kxMi5JTjguOThALjoiMzIuMSQ/ZZlpbjZ4eIA0KDYyDj9HNg4NNSwodH92bXRpdl1nZGV7fCwgPjY1Ljw0QDMxygQA", // ?
        "db_sha1": "792ae86cf579ac494dd4845cea6738a3b8b52480",
        "ro.build.fingerprint": "google/taimen/taimen:8.1.0/OPM1.171019.011/4448085:user/release-keys",
        "ro.build.tags": "release-keys",
        "ro.build.version.release": "8.1.0",
        "ro.product.board": "taimen",
        "ro.product.brand": "google",
        "ro.product.device": "taimen",
        "ro.product.manufacturer": "google",
        "ro.product.model": "Pixel 2 XL",
        "ro.product.name": "taimen",
        "signature": "ba5803d889a34bd5a974b7d43d688799c645a70f4aa86628198ccfe0e1df804dcc5b4a158920603a6f5e2a709c494aa49ae09e198c56b4a116bf7a1f6c21c2e8",
        "SuspiciousElement": []
      }, null, 4)).toString("base64")
    })

    client.clientKey = crypto.randomBytes(32)
    let authFormData = {
      auth_data: client.AESencrypt(authData, client.clientKey.slice(0, 16), client.clientKey.slice(16, 32)),
      dummy_token: client.RSAencrypt(client.clientKey)
    }
    client.signKey = client.XOR(client.XOR(client._applicationKey, client._baseKey), client.clientKey)

    let authResponse = await client.APIsingleRequest({ url: "/main.php/login/authkey", formData: authFormData, additional: [] })
    client.token = authResponse.response_data.authorize_token
    client.serverKey = authResponse.response_data.dummy_token
    client.log.debug(`Got token: ${client.token}`)

    return client // return class instance
  }

  public async login(params: loginOptions): Promise<IAPIResponse> {

    this.signKey = this.XOR(this.clientKey, Buffer.from(this.serverKey, "base64")) // update key
    let loginFormData = {
      login_key: this.AESencrypt(params.loginKey, this.signKey.slice(0, 16), this.signKey.slice(16, 32)),
      login_passwd: this.AESencrypt(params.loginPasswd, this.signKey.slice(0, 16), this.signKey.slice(16, 32))
    }
    let loginResponse = await this.APIsingleRequest({ url: "/main.php/login/login", formData: loginFormData, additional: [] })

    this.commandNum = 1
    this.user_id = loginResponse.response_data.user_id
    this.token = loginResponse.response_data.authorize_token // update token
    this.log.info(`Logged in as user #${this.user_id}`)

    delete this.serverKey
    delete this.clientKey
    return loginResponse
  }

  public static async createAccount(params: createAccountOptions) {
    let loginKey
    let loginPasswd
    if (
      typeof params.loginKey === "undefined" &&
      typeof params.loginPasswd === "undefined"
    ) {
      [loginKey, loginPasswd] = llclient.generateCredentials()
      params.loginKey = loginKey
      params.loginPasswd = loginPasswd
    } else { // you can provide your own loginKey & loginPasswd
      loginKey = <string>params.loginKey
      loginPasswd = <string>params.loginPasswd
    }
    let client = await llclient.authKey(<loginOptions>params)
    client.signKey = client.XOR(client.clientKey, Buffer.from(client.serverKey, "base64")) // update key
    let startUpFormData = {
      login_key: client.AESencrypt(loginKey, client.signKey.slice(0, 16), client.signKey.slice(16, 32)),
      login_passwd: client.AESencrypt(loginPasswd, client.signKey.slice(0, 16), client.signKey.slice(16, 32))
    }
    await client.APIsingleRequest({ url: "/main.php/login/startUp", formData: startUpFormData, additional: [] })

    client = await llclient.authKey(<loginOptions>params)
    await client.login(<loginOptions>params) // doLogin

    await client.userInfo()
    let tos = await client.toscheck()

    client.log.debug(`Agreeing to TOS...`)
    await client.sleep(Math.random() * 10000) // 1-10 secs for name change and agreeing to TOS

    if (tos.response_data.is_agreed === false) await client.tosAgree(tos.response_data.tos_id)
    await client.changeName(client.defaultNames[Math.floor(Math.random() * client.defaultNames.length)]) // select random default name
    await client.APIsingleRequest(`tutorial/progress`, {
      formData: {
        tutorial_state: 1
      },
      additional: ["commandNum", "mgd", "timeStamp"],
    })
    await client.startupAPI()
    // get all units and deck info
    await client.APImultiRequest([
      "unit/unitAll",
      "unit/deckInfo",
      "unit/supporterAll"
    ])

    let unitList: any[] = []

    client.log.debug(`Getting unit leader list`);
    (await client.APIsingleRequest(`login/unitList`, {
      additional: ["commandNum", "mgd", "timeStamp"],
    })).response_data.member_category_list.forEach((obj: any) => {
      obj.unit_initial_set.forEach((obj2: any) => {
        obj2.member_category = obj.member_category
        unitList.push(obj2)
      })
    })

    client.log.debug(`Selecting unit leader...`)
    await client.sleep(Math.random() * 10000) // 1-10 secs
    let selectedUnit = unitList[Math.floor(Math.random() * unitList.length)]
    client.mdg = selectedUnit.member_category // change mdg if Muse member was selected

    client.log.debug(`Selected unit leader ${selectedUnit.unit_initial_set_id} unit_id: ${selectedUnit.center_unit_id}`)
    await client.APIsingleRequest(`login/unitSelect`, {
      formData: {
        unit_initial_set_id: selectedUnit.unit_initial_set_id
      },
      additional: ["commandNum", "mgd", "timeStamp"]
    })

    client.log.debug(`Skipping tutorial...`)
    await client.APIsingleRequest(`tutorial/skip`, { additional: ["commandNum", "mgd", "timeStamp"] })

    // unit merge
    let unitBase = await client.APImultiRequest([
      "unit/unitAll",
      "unit/deckInfo",
      "unit/supporterAll"
    ])

    let base = unitBase.response_data[0].result.active[0].unit_owning_user_id
    let mergeSacrifice = [unitBase.response_data[0].result.active[10].unit_owning_user_id]
    // do merge
    await client.APIsingleRequest(`unit/merge`, {
      additional: ["commandNum", "mgd", "timeStamp"], formData: {
        unit_owning_user_ids: mergeSacrifice,
        base_owning_unit_user_id: base,
        unit_support_list: []
      }
    })
    await client.APIsingleRequest(`tutorial/skip`, { additional: ["commandNum", "mgd", "timeStamp"] })

    let rankupSacriface = [unitBase.response_data[0].result.active[9].unit_owning_user_id]
    // do rankup
    await client.APIsingleRequest(`unit/rankUp`, {
      additional: ["commandNum", "mgd", "timeStamp"], formData: {
        unit_owning_user_ids: rankupSacriface,
        base_owning_unit_user_id: base
      }
    })
    await client.APIsingleRequest(`tutorial/skip`, { additional: ["commandNum", "mgd", "timeStamp"] })

    return { client, loginKey, loginPasswd }
  }

  public static async startSession(params: loginOptions) {
    let client = await llclient.authKey(params)
    await client.login(params)
    let userInfo = await client.userInfo()
    await client.personalnoticeGet()
    await client.kidStatus()
    await client.downloadEvent()
    await client.toscheck()
    await client.lbonus()
    return { client, userInfo }
  }

  public async userInfo() {
    return await this.APIsingleRequest({ module: "user", action: "userInfo", additional: ["commandNum", "timeStamp", "mgd"] })
  }
  public async personalnoticeGet() {
    let response = await this.APIsingleRequest({ module: "personalnotice", action: "get", additional: ["commandNum", "timeStamp", "mgd"] })
    if (response.response_data.has_notice) {
      this.log.warn(`User have Personalnotice:`)
      this.log.warn(response.response_data)
      await this.APIsingleRequest({ module: "personalnotice", action: "agree", formData: { notice_id: response.response_data.notice_id }, additional: ["commandNum", "timeStamp", "mgd"] })
    }
    return response
  }
  public async kidStatus() {
    return await this.APIsingleRequest({ module: "handover", action: "kidStatus", additional: ["commandNum", "timeStamp", "mgd"] })
  }
  public async downloadEvent() {
    return await this.APIsingleRequest({
      url: "/main.php/download/event", additional: ["commandNum", "timeStamp", "mgd"], formData: {
        client_version: this.headers["Client-Version"],
        os: this.headers.OS,
        package_type: 5,
        excluded_package_ids: []
      }
    })
  }
  public async toscheck() {
    let response = await this.APIsingleRequest({ module: "tos", action: "tosCheck", additional: ["commandNum", "timeStamp", "mgd"] })
    if (!response.response_data.is_agreed && response.response_data.tos_id != 5) {
      this.log.warn(`User have unagreed TOS:`)
      this.log.warn(response.response_data)
      await this.tosAgree(response.response_data.tos_id)
    }
    return response
  }
  public async tosAgree(tosId: number) {
    return await this.APIsingleRequest({ module: "tos", action: "tosAgree", additional: ["commandNum", "timeStamp", "mgd"], formData: { tos_id: tosId } })
  }
  public async lbonus() {
    return await this.APIsingleRequest({ module: "lbonus", action: "execute", specialPoint: true, additional: ["commandNum", "timeStamp", "mgd"] })
  }
  public async changeName(name: string) {
    if (name.length > 10) { this.log.warn(`New name length more than 10 symbols`); this.log.warn(`The server will take this value, but still it is not recommended to make such long names`) }
    return await this.APIsingleRequest({ module: "user", action: "changeName", formData: { name }, additional: ["commandNum", "timeStamp", "mgd"] })
  }
  public async startupAPI() {
    this.log.debug(`Startup multi api call`)
    return await this.APImultiRequest([
      "login/topInfo",
      "login/topInfoOnce",
      "live/liveStatus",
      "live/schedule",
      "marathon/marathonInfo",
      "battle/battleInfo",
      "festival/festivalInfo",
      "online/info",
      "challenge/challengeInfo",
      "quest/questInfo",
      "duty/dutyInfo",
      "duel/duelInfo",
      "unit/unitAll",
      "unit/deckInfo",
      "unit/supporterAll",
      "unit/removableSkillInfo",
      "album/albumAll",
      "scenario/scenarioStatus",
      "subscenario/subscenarioStatus",
      "eventscenario/status",
      "payment/productList",
      "banner/bannerList",
      "notice/noticeMarquee",
      "user/getNavi",
      "navigation/specialCutin",
      "award/awardInfo",
      "background/backgroundInfo",
      "stamp/stampInfo",
      "exchange/owningPoint",
      "livese/liveseInfo",
      "liveicon/liveiconInfo"
    ])
  }

  // modules should be as ["module/action", "module/action"...]
  // example: ["user/userInfo", "secretbox/all"]
  public async APImultiRequest(modules: string[]): Promise<IAPIResponse> {
    this.log.debug(`Sending multi api`)
    let apiUrl = `/main.php/api`
    let signKey = this.signKey

    let formData = []
    for (let i = 0; i < modules.length; i++) {
      let moduleAction = modules[i].split("/")
      formData.push({
        module: moduleAction[0], // module
        action: moduleAction[1], // action
        timeStamp: Math.floor(Date.now() / 1000)
      })
    }

    return await this.postRequest(apiUrl, formData, <Buffer>signKey)
  }

  public async APIsingleRequest(apiUrl: string, options: APIsingleRequestOptions): Promise<IAPIResponse>
  public async APIsingleRequest(options: APIsingleRequestOptions): Promise<IAPIResponse>
  public async APIsingleRequest(): Promise<IAPIResponse> {
    let apiUrl = ``
    let options: APIsingleRequestOptions = {
      additional: [],
      formData: {}
    }
    // check function args
    if (typeof arguments[0] === "object") extend(true, options, arguments[0])
    if (typeof arguments[1] === "object") extend(true, options, arguments[1])
    if (typeof arguments[0] === "string") { // should be like `module/action`
      apiUrl = `/main.php/${arguments[0]}`
      if (arguments[0].split("/").length != 2) throw new Error(`invalid module/action argument`)
      options.formData.module = arguments[0].split("/")[0]
      options.formData.action = arguments[0].split("/")[1]
    }

    let signKey = options.specialPoint ? this.specialKey : <Buffer>this.signKey
    if (options.module && options.action && apiUrl.length === 0) {
      apiUrl = `/main.php/${options.module}/${options.action}`
      if (!options.formData) options.formData = {}

      options.formData.module = options.module
      options.formData.action = options.action
    } else if (typeof options.url === "string") apiUrl = options.url
    else if (apiUrl.length === 0 && !options.module && !options.action) throw new Error(`API url or module/action was not provided`)
    this.log.debug(`${apiUrl.split("/")[2]}/${apiUrl.split("/")[3]}`)
    this.commandNum += 1 // increase only in single request

    // check additional
    // set undefined for remove this field
    let sendFormData = {
      module: options.formData.module,
      action: options.formData.action,
      timeStamp: options.additional.includes("timeStamp") ? Math.floor(Date.now() / 1000) : undefined,
      mgd: options.additional.includes("mgd") ? this.mdg : undefined,
      commandNum: options.additional.includes("commandNum") ? `${this.loginKey}.${Math.floor(Date.now() / 1000)}.${this.commandNum}` : undefined
    }
    extend(true, sendFormData, options.formData)

    return await this.postRequest(apiUrl, sendFormData, signKey)
  }

  // overloads
  public XOR(val1: Buffer | string, val2: Buffer | string): Buffer
  public XOR(val1: Buffer | string, val2: Buffer | string, retString: boolean): string
  public XOR(val1: Buffer | string, val2: Buffer | string, retString = false) {
    // convert string to Buffer
    if (!Buffer.isBuffer(val1)) { val1 = Buffer.from(val1) }
    if (!Buffer.isBuffer(val2)) { val2 = Buffer.from(val2) }

    // do XORing
    let res = []
    if (val1.length > val2.length) for (let i = 0; i < val2.length; i++) res.push(val1[i] ^ val2[i])
    else for (let i = 0; i < val1.length; i++) res.push(val1[i] ^ val2[i])

    if (retString == false) return Buffer.from(res)
    else return Buffer.from(res).toString("utf-8")
  }
  public RSAencrypt(data: string | Buffer): string { // base64 string
    if (!Buffer.isBuffer(data)) data = Buffer.from(data)

    return crypto.publicEncrypt({ key: <string>this.rsaKey, padding: crypto.constants.RSA_PKCS1_PADDING }, data).toString("base64")
  }
  // if key is string then it should be base64 string
  public AESencrypt(data: string, key: Buffer | string, iv: Buffer | string): string { // base64 string
    if (!Buffer.isBuffer(key)) { key = Buffer.from(key, "base64") }
    if (!Buffer.isBuffer(iv)) { iv = Buffer.from(iv, "base64") }
    let cipher = crypto.createCipheriv("aes-128-cbc", key, iv)
    let encrypted = cipher.update(data)
    return Buffer.concat([iv, encrypted, cipher.final()]).toString("base64")
  }
  // for XMC calculating
  public HMACSHA1(data: any, key: Buffer) {
    return crypto.createHmac("sha1", key).update(data).digest("hex")
  }

  // emulate SIF's multipart
  private createMultipart(data: any) {
    let boundary = "-".repeat(24) + crypto.randomBytes(8).toString("hex") // random 16 chars
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="request_data"\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}--\r\n`
    let contentType = `multipart/form-data; boundary=${boundary}`
    return [contentType, body]
  }
  // just helper
  private async sleep(ms: number) {
    await new Promise((res) => {
      setTimeout(res, ms)
    })
  }
  // send request to server
  private async postRequest(apiUrl: string, formData: any, signKey: Buffer): Promise<IAPIResponse> {
    this.nonce += 1
    let logLabel = `${apiUrl.split("/")[2]}/${apiUrl.split("/")[3]}`

    let authrorize: any = {
      consumerKey: "lovelive_test",
      timeStamp: Math.floor(Date.now() / 1000),
      version: "1.1",
      nonce: this.nonce
    }
    if (this.token != undefined) authrorize.token = this.token
    let [contentType, requestBody] = this.createMultipart(formData)
    let serverResponse: IResponse = {
      body: "",
      headers: {},
      statusCode: 0
    }
    let errorMessage: string | undefined

    this.headers.Authorize = querystring.stringify(authrorize)
    if (typeof this.user_id != "undefined") this.headers["User-ID"] = this.user_id
    this.headers["X-Message-Code"] = this.HMACSHA1(JSON.stringify(formData), signKey)
    this.headers["Content-Length"] = requestBody.length
    this.headers["Content-Type"] = contentType

    this.log.verbose(`Request headers:`)
    this.log.verbose(this.headers)
    this.log.verbose(`Request body:`)
    this.log.verbose(formData)
    for (let connectionAttempt = 1; connectionAttempt <= 6; connectionAttempt++) { // allow overmax value for catching the error
      try {
        serverResponse = await this.performRequest({
          host: this.host,
          path: apiUrl,
          port: this.port,
          method: "POST",
          headers: this.headers,
          body: requestBody
        })
        if (serverResponse.statusCode === 423) {
          errorMessage = `This account is "locked" (a.k.a. banned)`
          break
        }
        if (<number>serverResponse.statusCode >= 400 && <number>serverResponse.statusCode <= 403 || <number>serverResponse.statusCode === 600) break
        if (serverResponse.statusCode != 200) {
          this.log.error(`HTTP Status Code: ${serverResponse.statusCode}`, logLabel)
          this.log.error(`HTTP response body: ${serverResponse.body}`, logLabel)
          throw new Error(``)
        }

        if (serverResponse.headers.maintenance == "1") {
          errorMessage = `Server under maintenance`
          break
        }

        if (serverResponse.headers["server-version"] && serverResponse.headers["server-version"] != this.headers["Client-Version"]) {
          this.log.warn(`Server Version ${serverResponse.headers["server-version"]} is different from Client Version ${this.headers["Client-Version"]}`, logLabel)
          this.log.warn(`Re-send request after version changing`, logLabel)
          this.headers["Client-Version"] = serverResponse.headers["server-version"]
          continue
        }
        break
      } catch (err) {
        if (connectionAttempt > 5) throw new Error(`Maximum reconnecting attempts reached`)
        if (err.code == "ETIMEDOUT") {
          this.log.error(`Connection timeout. Reconnecting attempt ${connectionAttempt} of 5`, logLabel)
          await this.sleep(5000)
          continue
        }
        this.log.error(err.message, logLabel)
        this.log.error(`Reconnecting attempt ${connectionAttempt} of 5`, logLabel)
        await this.sleep(5000)
      }
    }
    if (typeof errorMessage != "undefined") throw new Error(errorMessage)
    this.log.verbose(`Server response: ${serverResponse.body}`)

    let serverBody: IAPIResponse
    try {
      serverResponse.body = JSON.parse(serverResponse.body)
      if ((<any>serverResponse.body).response_data) {
        serverBody = {
          response_data: (<any>serverResponse.body).response_data,
          release_info: (<any>serverResponse.body).release_info,
          status_code: <number>serverResponse.statusCode
        }
      } else serverBody = {
        response_data: serverResponse.body,
        status_code: <number>serverResponse.statusCode
      }
    } catch (err) {
      throw new Error(`Failed to parse JSON body.\nRaw response:\n${serverResponse.body}`)
    }

    if (typeof serverBody.response_data.error_code === "number" || typeof serverBody.response_data.message == "string") throw new LoveLiveClientError(serverBody)
    return serverBody
  }

  private async performRequest(options: requestOptions): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      let req = request(options, (response) => {
        let chunks: any[] = []

        response.on("error", (err) => {
          reject(err)
        })

        response.on("data", (chunk) => {
          chunks.push(chunk)
        })

        response.on("end", async () => {
          let data: string | Buffer = Buffer.concat(chunks)

          try {
            if (response.headers["content-encoding"] === "gzip") {
              this.log.verbose(`Gunzip response...`)
              data = (<Buffer>(await promisify(gunzip)(data))).toString()
            } else data.toString("utf-8")
          } catch (err) {
            reject(err)
          }

          const result: IResponse = {
            body: <string>data,
            headers: response.headers,
            statusCode: response.statusCode
          }
          resolve(result)
        })
      })
      req.write(options.body)
      req.end()

      req.on("error", (err) => {
        reject(err)
      })
    })
  }

  public static generateCredentials() {
    function randomChars(length: number, type: "af09" | "89ab" | "az09") {
      let result = ""
      let base = ""
      switch (type) {
        case "af09": { base = "abcdef0123456789"; break }
        case "89ab": { base = "89ab"; break }
        case "az09": { base = "abcdefghijklmnopqrstuvwxyz0123456789"; break }
      }
      for (let i = 0; i < length; i++) {
        result += base.charAt(Math.floor(Math.random() * base.length))
      }
      return result
    }
    let loginKey = `${randomChars(8, "af09")}-${randomChars(4, "af09")}-4${randomChars(3, "af09")}-${randomChars(1, "89ab")}${randomChars(3, "af09")}-${randomChars(12, "af09")}` // sif's like credentials
    let loginPasswd = randomChars(128, "az09")
    return [loginKey, loginPasswd]
  }
}
