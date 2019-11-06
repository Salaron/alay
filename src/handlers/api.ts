import chalk from "chalk"
import { IncomingMessage, ServerResponse } from "http"
import { Utils } from "../common/utils"
import { Log } from "../core/log"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, HANDLER_TYPE, RESPONSE_TYPE } from "../models/constant"
import { IApiMultiResponse, IApiResult } from "../models/handlers"
import executeAction from "./action"
import { writeJsonResponse } from "./response"

const log = new Log("Api Handler")

export default async function moduleHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.API)
  try {
    // get auth level
    await requestData.getAuthLevel()
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      return await writeJsonResponse(response, {
        httpStatusCode: 403,
        connection: requestData.connection,
        responseData: "Rejected",
        direct: true
      })
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED) {
      return await writeJsonResponse(response, {
        httpStatusCode: 423,
        connection: requestData.connection,
        responseData: {},
        direct: true
      })
    }

    // "extract" module & action
    const urlSplit = request.url!.toLowerCase().split(/[?]+/)[0].split("/")
    if (!urlSplit[2]) throw new Error(`Invalid module (${urlSplit[2]})`)
    const module = urlSplit[2].replace(/[^a-z]/g, "")

    switch (module) {
      case "api": {
        const apiList = requestData.params
        if (apiList.length > Config.server.API_request_limit) throw new ErrorUser(`[mainHandler] API request limit reached ${apiList.length}/${Config.server.API_request_limit}`, requestData.user_id)

        const responseData: any[] = []

        const xmcStatus = await requestData.checkXMC(false)
        if (xmcStatus === false) throw new ErrorUser(`[mainHandler] Invalid X-Message-Code; user #${requestData.user_id}`, requestData.user_id)

        await apiList.forEachAsync(async (data: any, i: number) => {
          data.module = data.module.toLowerCase().replace(/[^a-z]/g, "")
          data.action = data.action.toLowerCase().replace(/[^a-z]/g, "")
          log.verbose(chalk.yellow(`${data.module}/${data.action} [${i + 1}/${apiList.length}]`), "api/multirequest")
          const res: IApiMultiResponse = {
            result: {},
            timeStamp: Utils.timeStamp(),
            status: 0,
            commandNum: false
          }
          requestData.params = data
          let result: IApiResult
          try {
            result = await executeAction(data.module, data.action, requestData, {
              responseType: RESPONSE_TYPE.MULTI,
              xmc: <string>request.headers["x-message-code"]
            })
          } catch (err) {
            log.error(err)
            res.status = 600
            return responseData.push(res)
          }
          if (result.headers && Object.keys(result.headers).length > 0) {
            for (const key of Object.keys(result.headers)) {
              response.setHeader(key, result.headers[key])
            }
          }
          res.status = result.status
          res.result = result.result
          responseData.push(res)
        })

        return writeJsonResponse(response, {
          httpStatusCode: 200,
          responseData,
          authToken: requestData.auth_token,
          userId: requestData.user_id,
          xmc: <string>request.headers["x-message-code"],
          encoding: <string>request.headers["accept-encoding"],
          nonce: requestData.auth_header.nonce,
          connection: requestData.connection
        })
      }

      default: {
        if (!urlSplit[3]) throw new Error(`Invalid action (${urlSplit[3]})`)
        const action = urlSplit[3].replace(/[^a-z]/g, "")
        const result: IApiResult = await executeAction(module, action, requestData, {
          responseType: RESPONSE_TYPE.SINGLE,
          xmc: <string>request.headers["x-message-code"]
        })
        if (result.headers && Object.keys(result.headers).length > 0) {
          for (const key of Object.keys(result.headers)) {
            response.setHeader(key, result.headers[key])
          }
        }

        return writeJsonResponse(response, {
          httpStatusCode: 200,
          jsonStatusCode: result.status,
          responseData: result.result,
          authToken: requestData.auth_token,
          userId: requestData.user_id,
          xmc: <string>request.headers["x-message-code"],
          encoding: <string>request.headers["accept-encoding"],
          nonce: requestData.auth_header.nonce,
          connection: requestData.connection
        })
      }
    }
  } catch (err) {
    if (requestData.connection.released === false) await requestData.connection.rollback()
    throw err
  }
}
