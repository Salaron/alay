import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { Logger } from "../../../core/logger"

const logger = new Logger("Browser Error")

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    // this error will be saved in logs (logs/error.log)
    logger.error(`
      User ID: ${this.user_id}
      Message: ${this.params.message || null}
      URL: ${this.params.url || null}
      Stack: ${this.params.stacktrace || null}
    `)

    return {
      status: 200,
      result: []
    }
  }
}
