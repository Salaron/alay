import crypto from "crypto"
import { IncomingMessage } from "http"
import moment from "moment"
import request from "request"
import { promisify } from "util"
import { Log } from "../core/log"
import { Connection } from "../core/database/mariadb"

const log = new Log("Common: Utils")

export async function init() {
  // Handle Clearing Temp Auth Tokens every 5 min
  setInterval(async () => {
    try {
      const connection = await Connection.beginTransaction()
      try {
        const [tokens, codes] = await Promise.all([
          connection.query("SELECT * FROM auth_tokens WHERE expire <= CURRENT_TIMESTAMP"),
          connection.query("SELECT * FROM auth_recovery_codes WHERE expire <= CURRENT_TIMESTAMP")
        ])
        await tokens.forEachAsync(async (token) => {
          await connection.query("DELETE FROM auth_tokens WHERE token = :token", { token: token.token })
        })
        await codes.forEachAsync(async (code) => {
          await connection.query("DELETE FROM auth_recovery_codes WHERE token = :token", { token: code.token })
        })
        await connection.commit(true)
      } catch (err) {
        connection.rollback(true)
        log.error(err)
      }
    } catch (err) {
      log.error(err)
    }
  }, 300000)
  moment.locale(Config.i18n.defaultLanguage)
}

export class Utils {
  public static parseDate(value: Date | number, timestamp?: boolean) {
    if (typeof value === "number" || value instanceof Date) {
      if (typeof value === "number" && timestamp) value = Math.floor(value * 1000)
      let d
      if (typeof value === "number") d = new Date(value)
      else d = value
      const YYYY = ("000" + d.getFullYear()).substr(-4)
      const MM = ("0" + (d.getMonth() + 1)).substr(-2)
      const DD = ("0" + d.getDate()).substr(-2)
      const HH = ("0" + d.getHours()).substr(-2)
      const MINMIN = ("0" + d.getMinutes()).substr(-2)
      const SS = ("0" + d.getSeconds()).substr(-2)
      return `${YYYY}-${MM}-${DD} ${HH}:${MINMIN}:${SS}`
    } else {
      return value
    }
  }

  // Source: http://stackoverflow.com/a/6832721/50079
  public static versionCompare(v1: string | number, v2: string | number, options?: any) {
    const lexicographical = options && options.lexicographical
    const zeroExtend = options && options.zeroExtend
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

  public static AESEncrypt(key: any, data: any, iv: any) {
    if (!Buffer.isBuffer(data)) { data = Buffer.from(data) }
    if (!Buffer.isBuffer(key)) { key = Buffer.from(key, "base64") }
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv)
    let encrypted = cipher.update(data, "utf8")
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return Buffer.concat([iv, encrypted]).toString("base64")
  }
  public static AESDecrypt(key: any, data: any) {
    const dataBuf = Buffer.from(data, "base64")
    const keyBuf = Buffer.from(key, "base64")
    const iv = dataBuf.slice(0, 16)
    const decipher = crypto.createDecipheriv("aes-128-cbc", keyBuf, iv)
    const decrypted = decipher.update(dataBuf.slice(16, dataBuf.length))
    return Buffer.concat([decrypted, decipher.final()]).toString("utf8")
  }

  public static RSADecrypt(data: string) {
    const buffer = Buffer.from(Buffer.from(data, "base64"))
    return crypto.privateDecrypt({
      key: Config.server.PRIVATE_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }, buffer).toString("base64")
  }
  public static RSASign(data: string) {
    const sign = crypto.createSign("RSA-SHA1")
    sign.update(data)
    return sign.sign(Config.server.PRIVATE_KEY, "base64")
  }

  // Bitwise XOR two values
  public static xor(a: any, b: any) {
    if (!Buffer.isBuffer(a)) { a = Buffer.from(a) }
    if (!Buffer.isBuffer(b)) { b = Buffer.from(b) }
    const res = []
    const max = a.length > b.length ? b.length : a.length
    for (let i = 0; i < max; i++) {
      res.push(a[i] ^ b[i])
    }
    return Buffer.from(res)
  }

  public static hmacSHA1(data: string, key: string | Buffer) {
    if (typeof key === "string") key = Buffer.from(key, "base64")
    const hmacsha1 = crypto.createHmac("sha1", key)
    hmacsha1.update(data)
    return hmacsha1.digest("hex")
  }
  public static hashSHA1(data: string | number) {
    if (typeof data != "string") data = data.toString()
    const sum = crypto.createHash("sha1")
    sum.update(data)
    return sum.digest("hex")
  }

  public static getRandomNumber(min: number, max: number) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
  public static createObjCopy<T>(object: T): T {
    return JSON.parse(JSON.stringify(object))
  }

  public static randomString(length: number, options?: string) {
    let result = ""
    let base = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    if (options === "upper") base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    for (let i = 0; i < length; i++) {
      result += base.charAt(Math.floor(Math.random() * base.length))
    }
    return result
  }
  public static mergeArrayDedupe(array: any): any[] {
    return [...new Set([].concat(...array))]
  }
  public static toSpecificTimezone(utcOffset = 9, date?: string | Date) {
    if (!date) date = new Date()
    return moment(date).utcOffset(utcOffset).format("YYYY-MM-DD HH:mm:ss")
  }

  public static timeStamp() {
    return Math.floor(Date.now() / 1000)
  }
  public static isUnderMaintenance() {
    return (
      (Utils.toSpecificTimezone(Config.maintenance.time_zone) < Config.maintenance.end_date &&
        Utils.toSpecificTimezone(Config.maintenance.time_zone) >= Config.maintenance.start_date) ||
      Config.maintenance.force_enabled
    )
  }
  public static canBypassMaintenance(userId: number) {
    const admins = Config.server.admin_ids.map(Number)
    const bypassList = Config.maintenance.bypass.map(Number)

    return (
      admins.includes(userId) ||
      bypassList.includes(userId)
    )
  }

  public static async reCAPTCHAverify(userToken: string, userIp?: string) {
    // TODO: use axios for request
    // @ts-ignore
    const { body } = (await promisify(request.post)(<string>"https://www.google.com/recaptcha/api/siteverify", <any>{
      form: {
        secret: Config.modules.login.recaptcha_private_key,
        response: userToken,
        remoteip: userIp
      }
    })) as any
    const response = JSON.parse(body)
    if (response.success != true) {
      log.error(`reCAPTCHA test Failed;\n Error-codes: ${response["error-codes"].join(", ")}`)
      throw new ErrorWebApi(`reCAPTCHA test failed`)
    }
  }

  public static prepareTemplate(template: string, values: any = {}) {
    return template.replace(/{{\s?([^{}\s]*)\s?}}/g, (txt: any, key: any) =>  {
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

  public static getRemoteAddress(request: IncomingMessage): string {
    if (typeof request.headers["x-real-ip"] === "string") {
      return request.headers["x-real-ip"]
    }
    if (typeof request.headers["x-forwarded-for"] === "string") {
      return request.headers["x-forwarded-for"]
    }
    if (typeof request.connection.remoteAddress != "string") throw new Error("Remote address is missing")
    return request.connection.remoteAddress
  }

  public static checkPass(input: string) {
    return input.match(/^[A-Za-z0-9]\w{1,32}$/)
  }
  public static checkMail(input: string) {
    const regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,6})+$/
    return regex.test(input)
  }
}
