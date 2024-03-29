import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { promisify } from "util"
import { readFile, exists } from "fs"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.ADMIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let warn = ""
    let error = ""
    if (await promisify(exists)(`./logs/warn.log`)) {
      warn = await promisify(readFile)(`./logs/warn.log`, "utf-8")
    }
    if (await promisify(exists)(`./logs/error.log`)) {
      error = await promisify(readFile)(`./logs/error.log`, "utf-8")
    }
    return {
      status: 200,
      result: {
        warn,
        error
      }
    }
  }
}
