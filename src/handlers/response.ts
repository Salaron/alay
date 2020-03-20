import { ServerResponse } from "http"
import querystring from "querystring"
import { Utils } from "../common/utils"
import { Logger } from "../core/logger"
import { Authorize } from "../core/requestData"

const logger = new Logger("Response")

export async function writeJsonResponse(response: ServerResponse, options: Options = {}) {
  response.setHeader("Content-Type", "application/json")
  response.setHeader("user_id", options.userId || "")
  response.setHeader("status_code", options.jsonStatusCode || options.httpStatusCode || 200)
  response.setHeader("Server-Version", Config.server.server_version)

  const authHeader: Authorize = {
    consumerKey: Config.client.consumer_key.length > 0 ? Config.client.consumer_key : "lovelive_test",
    timeStamp: Utils.timeStamp(),
    version: "1.1",
    nonce: options.nonce || 1,
    requestTimeStamp: Utils.timeStamp()
  }
  if (options.authToken) authHeader.token = options.authToken
  response.setHeader("authorize", querystring.stringify(<any>authHeader))

  let result: any = null
  if (options.maintenanceFlag) response.setHeader("maintenance", 1)
  if (options.clientUpdateFlag) response.setHeader("client-update", 1)

  if (!options.maintenanceFlag && !options.clientUpdateFlag && options.responseData) {
    if (options.direct) result = options.responseData
    else result = {
      response_data: options.responseData,
      release_info: Config.server.release_info,
      status_code: options.jsonStatusCode || 200
    }
  }
  response.statusCode = options.httpStatusCode || options.jsonStatusCode || 200

  const responseString = JSON.stringify(result)
  response.setHeader("X-Message-Sign", Utils.RSASign(responseString + options.xmc))
  logger.verbose(responseString)
  response.write(responseString)
  response.end()
}

interface Options {
  jsonStatusCode?: number
  httpStatusCode?: number
  authToken?: string | null
  userId?: number | null
  xmc?: string
  nonce?: number | string
  responseData?: any
  direct?: boolean
  maintenanceFlag?: boolean
  clientUpdateFlag?: boolean
}
