import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import moment from "moment"
import { promisify } from "util";
import { readFile, fstat, exists } from "fs";

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.ADMIN

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public async execute() {
    let warn = ""
    let error = ""
    if (await promisify(exists)(`${rootDir}/logs/warn.log`)) {
      warn = await promisify(readFile)(`${rootDir}/logs/warn.log`, "utf-8")
    }
    if (await promisify(exists)(`${rootDir}/logs/error.log`)) {
      error = await promisify(readFile)(`${rootDir}/logs/error.log`, "utf-8")
    }
    return {
      status: 200,
      result: {
        warn: warn,
        error: error
      }
    }
  }
}