import Log from "../core/log"
import * as fs from "fs"
import crypto from "crypto"
import { promisify } from "util"
import { Connection } from "../core/database"
import moment from "moment"

const log = new Log.Create(logLevel, "Utils")

export let RSA_PRIVATE_KEY = ""
export let RSA_PUBLIC_KEY = ""

export async function init() {
  // Handle Clearing Temp Auth Tokens every 15 sec
  setInterval(async () => {
    let connection = await MySQLconnection.get()
    try {
      let tokens = await connection.query("SELECT * FROM auth_tokens WHERE expire <= CURRENT_TIMESTAMP")
      await tokens.forEachAsync(async (token: any) => {
        await connection.query("DELETE FROM auth_tokens WHERE token=:token", { token: token.token })
      })
      await connection.commit()
    } catch (err) {
      connection.rollback()
      log.error(err)
    }
  }, 1500)
}

export class Utils_ {
  connection: Connection
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

  // AES-128-CBC Encryption for login v5 support
  static encryptAES(key: any, data: any, iv: any) {
    if (!Buffer.isBuffer(data)) { data = Buffer.from(data) }
    if (!Buffer.isBuffer(key)) { key = Buffer.from(key, "base64") }
    let cipher = crypto.createCipheriv("aes-128-cbc", key, iv)
    let encrypted = cipher.update(data, "utf8")
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return Buffer.concat([iv, encrypted]).toString("base64")
  }

  // AES-128-CBC Decryption for login v5 support
  static decryptAES(key: any, data: any) {
    data = Buffer.from(data, "base64")
    key = Buffer.from(key, "base64")
    let iv = data.slice(0, 16)
    let decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
    let decrypted = decipher.update(data.slice(16, data.length))
    return Buffer.concat([decrypted, decipher.final()]).toString("utf8")
  }

  // RSA-1024 decryption for login v5 support
  static privateDecrypt(data: any) {
    data = Buffer.from(data, "base64")
    let buffer = Buffer.from(data)
    return crypto.privateDecrypt({ 
      key: RSA_PRIVATE_KEY, 
      padding: crypto.constants.RSA_PKCS1_PADDING 
    }, buffer).toString("base64")
  }

  // Bitwise XOR two values
  static xor(a: any, b: any) {
    if (!Buffer.isBuffer(a)) { a = Buffer.from(a) }
    if (!Buffer.isBuffer(b)) { b = Buffer.from(b) }
    let res = []
    if (a.length > b.length) {
      for (let i = 0; i < b.length; i++) {
        res.push(a[i] ^ b[i])
      }
    } else {
      for (let i = 0; i < a.length; i++) {
        res.push(a[i] ^ b[i])
      }
    }
    return Buffer.from(res)
  }

  // HMAC-SHA1 for calculating XMC
  static HMACSHA1(data: any, key: any) {
    let hmacsha1 = crypto.createHmac("sha1", Buffer.from(key, "base64"))
    hmacsha1.update(data)
    return hmacsha1.digest("hex")
  }

  static HASHSHA1(data: any) {
    if (typeof data != "string") data = data.toString()
    let sum = crypto.createHash("sha1")
    sum.update(data)
    return sum.digest("hex")
  }

  static rsaSign(data: string) {
    let sign = crypto.createSign("RSA-SHA1")
    sign.update(data)
    return sign.sign(RSA_PRIVATE_KEY, "base64")
  }

  static randomNumber(min: number, max: number) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  static createCopy(object: any) {
    return JSON.parse(JSON.stringify(object))
  }

  async createToken(loginKey: string, loginPasswd: string, token: string, sessionKey: string, expire: number) {
    let data = await this.connection.first("SELECT token FROM auth_tokens WHERE token = :token", { token: token })
    if (data.length != 0) return false

    await this.connection.query("INSERT INTO auth_tokens (token, expire, session_key, login_key, login_passwd) VALUES (:token, :expire, :sk, :lk, :lp)", {
      token: token,
      expire: Utils.parseDate(expire),
      sk: sessionKey,
      lk: loginKey,
      lp: loginPasswd
    })
    return token
  }

  async destroyToken(token: string): Promise<void> {
    await this.connection.query(`DELETE FROM auth_tokens WHERE token = :token`, { token: token })
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
  
  async checkIfAdmin(userId: number, withTime = false) {
    if (withTime === false) return Config.server.admin_ids.includes(userId)
    let user = await this.connection.first(`SELECT last_admin_access FROM user_login WHERE user_id = :user`, {
      user: userId
    })
    return (
      Config.server.admin_ids.includes(userId) && (
        user.last_admin_access != null && moment(Date.now()).diff(moment(user.last_admin_access), "s") < 1200
      )
    )
  }

  static mergeArrayDedupe(array: any) {
    return [...new Set([].concat(...array))]
  }
  static toJPtimezone(date?: string | Date) {
    if (!date) date = new Date()
    return moment(date).utcOffset("+0900").format("YYYY-MM-DD HH:mm:SS")
  }
}
(global as any).Utils = Utils_