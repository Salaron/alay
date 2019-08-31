import { Log } from "../core/log"
import crypto from "crypto"
import moment from "moment"
import { promisify } from "util"
import { readFile } from "fs"
import extend from "extend"
import request from "request"
import { Connection } from "../core/database_wrappers/mysql"

const log = new Log("Common: Utils")

export async function init() {
  // Handle Clearing Temp Auth Tokens every 5 min
  setInterval(async () => {
    try {
      let connection = await MySQLconnection.get()
      try {
        let tokens = await connection.query("SELECT * FROM auth_tokens WHERE expire <= CURRENT_TIMESTAMP")
        await tokens.forEachAsync(async (token) => {
          await connection.query("DELETE FROM auth_tokens WHERE token=:token", { token: token.token })
        })
        await connection.commit()
      } catch (err) {
        connection.rollback()
        log.error(err)
      }
    } catch (err) {
      log.error(err)
    }
  }, 300000)
  moment.locale(Config.i18n.defaultLanguage)
}

export class Utils {
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  static parseDate(value: Date | number, timestamp?: boolean) {
    if (typeof value === "number" || value instanceof Date) {
      if (typeof value === "number" && timestamp) value = Math.floor(value * 1000)
      let d
      if (typeof value === "number") d = new Date(value)
      else d = value
      let YYYY = ("000" + d.getFullYear()).substr(-4)
      let MM = ("0" + (d.getMonth() + 1)).substr(-2)
      let DD = ("0" + d.getDate()).substr(-2)
      let HH = ("0" + d.getHours()).substr(-2)
      let MINMIN = ("0" + d.getMinutes()).substr(-2)
      let SS = ("0" + d.getSeconds()).substr(-2)
      return `${YYYY}-${MM}-${DD} ${HH}:${MINMIN}:${SS}`
    } else {
      return value
    }
  }

  // Source: http://stackoverflow.com/a/6832721/50079
  static versionCompare(v1: string | number, v2: string | number, options?: any) {
    let lexicographical = options && options.lexicographical
    let zeroExtend = options && options.zeroExtend
    let v1parts = (v1 as any).split(".")
    let v2parts = (v2 as any).split(".")

    function isValidPart(x: any) {
      return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x)
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) return NaN

    if (zeroExtend) {
      while (v1parts.length < v2parts.length) v1parts.push("0")
      while (v2parts.length < v1parts.length) v2parts.push("0")
    }

    if (!lexicographical) {
      v1parts = v1parts.map(Number)
      v2parts = v2parts.map(Number)
    }

    for (let i = 0; i < v1parts.length; ++i) {
      if (v2parts.length == i) return 1

      if (v1parts[i] == v2parts[i]) continue
      else if (v1parts[i] > v2parts[i]) return 1
      else return -1
    }
    if (v1parts.length != v2parts.length) return -1
    return 0
  }

  static AESEncrypt(key: any, data: any, iv: any) {
    if (!Buffer.isBuffer(data)) { data = Buffer.from(data) }
    if (!Buffer.isBuffer(key)) { key = Buffer.from(key, "base64") }
    let cipher = crypto.createCipheriv("aes-128-cbc", key, iv)
    let encrypted = cipher.update(data, "utf8")
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return Buffer.concat([iv, encrypted]).toString("base64")
  }
  static AESDecrypt(key: any, data: any) {
    let dataBuf = Buffer.from(data, "base64")
    let keyBuf = Buffer.from(key, "base64")
    let iv = dataBuf.slice(0, 16)
    let decipher = crypto.createDecipheriv("aes-128-cbc", keyBuf, iv)
    let decrypted = decipher.update(dataBuf.slice(16, dataBuf.length))
    return Buffer.concat([decrypted, decipher.final()]).toString("utf8")
  }

  static RSADecrypt(data: string) {
    let buffer = Buffer.from(Buffer.from(data, "base64"))
    return crypto.privateDecrypt({
      key: Config.server.PRIVATE_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer).toString("base64")
  }
  static RSASign(data: string) {
    let sign = crypto.createSign("RSA-SHA1")
    sign.update(data)
    return sign.sign(Config.server.PRIVATE_KEY, "base64")
  }

  // Bitwise XOR two values
  static xor(a: any, b: any) {
    if (!Buffer.isBuffer(a)) { a = Buffer.from(a) }
    if (!Buffer.isBuffer(b)) { b = Buffer.from(b) }
    let res = []
    let max = a.length > b.length ? b.length : a.length
    for (let i = 0; i < max; i++) {
      res.push(a[i] ^ b[i])
    }
    return Buffer.from(res)
  }

  static hmacSHA1(data: string, key: string | Buffer) {
    if (typeof key === "string") key = Buffer.from(key, "base64")
    let hmacsha1 = crypto.createHmac("sha1", key)
    hmacsha1.update(data)
    return hmacsha1.digest("hex")
  }
  static hashSHA1(data: string | number) {
    if (typeof data != "string") data = data.toString()
    let sum = crypto.createHash("sha1")
    sum.update(data)
    return sum.digest("hex")
  }

  static getRandomNumber(min: number, max: number) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
  static createObjCopy(object: any) {
    return JSON.parse(JSON.stringify(object))
  }

  static randomString(length: number, options?: string) {
    let result = ""
    let base = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    if (options === "upper") base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    for (let i = 0; i < length; i++) {
      result += base.charAt(Math.floor(Math.random() * base.length))
    }
    return result
  }
  static mergeArrayDedupe(array: any): any[] {
    return [...new Set([].concat(...array))]
  }
  static toSpecificTimezone(utcOffset: number = 9, date?: string | Date) {
    if (!date) date = new Date()
    return moment(date).utcOffset(utcOffset).format("YYYY-MM-DD HH:mm:ss")
  }

  static timeStamp() {
    return Math.floor(Date.now() / 1000)
  }
  static isUnderMaintenance() {
    return (
      (Utils.toSpecificTimezone(Config.maintenance.time_zone) < Config.maintenance.end_date &&
        Utils.toSpecificTimezone(Config.maintenance.time_zone) >= Config.maintenance.start_date) ||
      Config.maintenance.force_enabled
    )
  }
  static canBypassMaintenance(userId: number) {
    let admins = Config.server.admin_ids.map(Number)
    let bypassList = Config.maintenance.bypass.map(Number)

    return (
      admins.includes(userId) ||
      bypassList.includes(userId)
    )
  }

  public async getCurrentOnline() {
    return (await this.connection.first("SELECT COUNT(*) as cnt FROM user_login WHERE last_activity>:now", {
      now: moment(new Date()).subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss")
    })).cnt
  }
  public async loadLocalization(...sections: string[]) {
    let result: any = {}
    let defaultStr = JSON.parse(await promisify(readFile)(`${rootDir}/i18n/${Config.i18n.defaultLanguage}.json`, `utf-8`))

    for (let langName in Config.i18n.langCodes) {
      let langCode = Config.i18n.langCodes[langName]
      let file
      try {
        file = JSON.parse(await promisify(readFile)(`${rootDir}/i18n/${langCode}.json`, `utf-8`))
      } catch (err) {
        err.message = `Can't parse file with strings for '${langName}' language`
        throw err
      }
      result[langCode] = {}
      for (let section of sections) {
        extend(true, result[langCode], defaultStr[section], file[section])
      }
      extend(true, result[langCode], defaultStr["common"] || {}, file["common"])
    }
    return result
  }
  public async getUserLangCode(userId: number | null, preLogin = false, token?: string): Promise<string> {
    if (preLogin === true) {
      return (await this.connection.first("SELECT language FROM auth_tokens WHERE token = :token", { token: token })).language
    }
    return (await this.connection.first("SELECT language FROM users WHERE user_id=:user", { user: userId })).language
  }

  public async reCAPTCHAverify(userToken: string, userIp?: string) {
    let { body } = (await promisify(request.post)(<any>"https://www.google.com/recaptcha/api/siteverify", <any>{
      form: {
        secret: Config.modules.login.recaptcha_private_key,
        response: userToken,
        remoteip: userIp
      }
    })) as any
    let response = JSON.parse(body)
    if (response.success != true) {
      log.error(`reCAPTCHA test Failed;\n Error-codes: ${response["error-codes"].join(", ")}`)
      throw new ErrorWebApi(`reCAPTCHA test failed`)
    }
  }

  public static prepareTemplate(template: string, values: any = {}) {
    return template.replace(/{{\s?([^{}\s]*)\s?}}/g, function (txt: any, key: any) {
      if (values.hasOwnProperty(key)) {
        return values[key]
      }
      return txt
    })
  }

  public static getTimeZoneWithPrefix(tz: number) {
    if (tz < 0) return `-${tz}`
    else if (tz > 0) return `+${tz}`
    else return `${tz}`
  }
}