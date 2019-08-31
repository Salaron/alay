import { HANDLER_TYPE, AUTH_LEVEL, RESPONSE_TYPE } from "../core/requestData"
import { IncomingMessage, ServerResponse } from "http"
import { writeJsonResponse } from "../handlers/apiHandler"
import executeAction from "../handlers/actionHandler"
import RequestData from "../core/requestData"
import { Log } from "../core/log"
import chalk from "chalk"
import { Utils } from "../common/utils"
import { MultiResponse, ActionResult } from "../typings/handlers"

const log = new Log("Main Handler")

export default async function moduleHandler(request: IncomingMessage, response: ServerResponse) {
  let requestData = await RequestData.Create(request, response, HANDLER_TYPE.MAIN)
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
        let apiList = requestData.params
        if (apiList.length > Config.server.API_request_limit) throw new ErrorUser(`[mainHandler] API request limit reached ${apiList.length}/${Config.server.API_request_limit}`, requestData.user_id)

        let responseData: any[] = []

        let xmcStatus = await requestData.checkXMC(false)
        if (xmcStatus === false) throw new ErrorUser(`[mainHandler] Invalid X-Message-Code; user #${requestData.user_id}`, requestData.user_id)

        await apiList.forEachAsync(async (data: any, i: number) => {
          await log.verbose(chalk.yellow(`${data.module}/${data.action} [${i + 1}/${apiList.length}]`), "api/multirequest")
          let res: MultiResponse = {
            result: {},
            timeStamp: Utils.timeStamp(),
            status: 0,
            commandNum: false
          }
          requestData.params = data
          let result: ActionResult
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
            for (let key of Object.keys(result.headers)) {
              response.setHeader(key, result.headers[key])
            }
          }
          res.status = result.status
          res.result = result.result
          responseData.push(res)
        })

        return writeJsonResponse(response, {
          httpStatusCode: 200,
          responseData: responseData,
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
        let result: ActionResult = await executeAction(module, action, requestData, {
          responseType: RESPONSE_TYPE.SINGLE,
          xmc: <string>request.headers["x-message-code"]
        })
        if (!Array.isArray(result.result) && result.status === 200 && Type.isUndefined(result.result.server_timestamp)) {
          result.result.server_timestamp = Utils.timeStamp()
        }
        if (result.headers && Object.keys(result.headers).length > 0) {
          for (let key of Object.keys(result.headers)) {
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
    await requestData.connection.rollback()
    throw err
  }
}