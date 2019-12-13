import { default as GrisClient } from "gris"
import { Logger } from "./logger"
import { Utils } from "../common/utils"

const logger = new Logger("Gris")
let gris: GrisClient

export class Gris extends GrisClient {
  private lastRequestTimestamp = Utils.timeStamp()
  constructor() {
    super(Config.gris)
    if (typeof gris === "undefined") gris = this
  }
  public static getInstance() {
    return gris
  }

  public async prepare() {
    const response = await gris.startApp()
    const userInfo = response[0].response_data.user
    logger.info(`Successfully connected to official server`)
    logger.info(`User ID: ${userInfo.user_id}, name: ${userInfo.name}, loveca count: ${userInfo.sns_coin}`)
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
