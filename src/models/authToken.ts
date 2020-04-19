import { Redis } from "../core/database/redis"

export class AuthToken {
  public token: string
  public sessionKey: string
  public loginKey: string
  public loginPasswd: string
  private expireTime = 1000 * 60 * 30 // 30 mins
  constructor(token: string) {
    this.token = token
  }

  public set(sessionKey: string, loginKey: string, loginPasswd: string) {
    this.sessionKey = sessionKey
    this.loginKey = loginKey
    this.loginPasswd = loginPasswd
  }

  public async get() {
    const result = await Redis.get(`authToken:${this.token}`)
    if (!result) return null
    const tokenData = JSON.parse(result)
    this.sessionKey = tokenData.sessionKey
    this.loginKey = tokenData.loginKey
    this.loginPasswd = tokenData.loginPasswd
    return tokenData
  }

  public async save() {
    await Redis.set(`authToken:${this.token}`, JSON.stringify({
      sessionKey: this.sessionKey,
      loginKey: this.loginKey,
      loginPasswd: this.loginPasswd
    }), "ex", this.expireTime)
  }

  public async destroy() {
    await Redis.del(`authToken:${this.token}`)
  }
}