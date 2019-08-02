import { ServerResponse } from "http"
import querystring from "querystring"
import { promisify } from "util"
import { gzip } from "zlib"
import { LEVEL } from "../core/log"

export async function writeJsonResponse(response: ServerResponse, options: Options = {}) {
  response.setHeader("Content-Type", "application/json")
  response.setHeader("user_id", options.userId || "")
  response.setHeader("status_code", options.jsonStatusCode || options.httpStatusCode || 200)
  if (Config.server.server_version.length > 0) response.setHeader("Server-Version", Config.server.server_version)

  let authHeader: Authorize = {
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
      status_code: options.jsonStatusCode
    }
  }
  response.statusCode = options.httpStatusCode || options.jsonStatusCode || 200

  if (Config.server.PRIVATE_KEY.length != 0) response.setHeader("X-Message-Sign", Utils.RSASign(JSON.stringify(result) + options.xmc))
  if (options.connection && options.connection.released === false) await options.connection.commit()
  if (Config.server.log_level >= LEVEL.VERBOSE) console.log(JSON.stringify(result))

  if (options.encoding && options.encoding.indexOf("gzip") != -1) {
    response.setHeader("Content-Encoding", "gzip")
    response.write(await promisify(gzip)(JSON.stringify(result)))
  } else {
    response.write(JSON.stringify(result))
  }
  response.end()
}

interface Options {
  jsonStatusCode?: number
  httpStatusCode?: number
  authToken?: string | null
  userId?: number | null
  xmc?: string
  encoding?: string
  nonce?: number | string
  responseData?: any
  direct?: boolean
  maintenanceFlag?: boolean
  clientUpdateFlag?: boolean
  connection?: Connection
}