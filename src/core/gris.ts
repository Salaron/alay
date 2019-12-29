import { default as GrisClient } from "gris"
import { Logger } from "./logger"
import { Utils } from "../common/utils"

const logger = new Logger("Gris")
let gris: GrisClient
let queue: Array<(gris: GrisClient) => Promise<void>> = []

export class Gris extends GrisClient {
  public static getInstance() {
    return gris
  }

  public static executeOnReady(func: any) {
    queue.push(func)
  }
  private lastRequestTimestamp = Utils.timeStamp()
  constructor() {
    super(Config.gris)
    if (typeof gris === "undefined") gris = this
  }

  public async prepare() {
    await gris.startApp()
    logger.info(`Successfully connected to official server`)
    logger.info(`User ID: ${gris.session.userId}`)
  }

  public async executeQueue() {
    logger.info("Executing queue...")
    for (const func of queue) {
      await func(gris)
    }
  }

  protected async postRequest(endPoint: string, signKey: Buffer, formData?: any) {
    if (Utils.timeStamp() - this.lastRequestTimestamp > 82800) { // 23 hours
      logger.debug("Current session is expired; creating new one")
      this.clearSession()
      await this.prepare()
    }
    this.lastRequestTimestamp = Utils.timeStamp()
    return super.postRequest(endPoint, signKey, formData)
  }

  private clearSession() {
    this.session = {
      ...this.session,
      authToken: "",
      userId: 0,
      nonce: 0,
      commandNum: 2
    }
    this.lastRequestTimestamp = Utils.timeStamp()
  }
}
