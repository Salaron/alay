import chalk from "chalk"
import { IncomingMessage, ServerResponse } from "http"
import { Utils } from "../common/utils"
import { Logger } from "../core/logger"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, HANDLER_TYPE, RESPONSE_TYPE } from "../models/constant"
import { IApiMultiResponse, IAPIResult } from "../models/handlers"
import executeAction from "./action"
import { writeJsonResponse } from "./response"
import { ErrorAPI } from "../models/error"

const log = new Logger("API Handler")

export default async function moduleHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.API)
  try {
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      throw new ErrorAPI("No permissions")
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED) {
      await requestData.connection.commit()
      await writeJsonResponse(response, {
        httpStatusCode: 423,
        responseData: {},
        direct: true
      })
      return
    }

    // "extract" module & action
    const urlSplit = request.url!.toLowerCase().split(/[?]+/)[0].split("/")
    if (!urlSplit[2]) throw new Error(`Invalid module name (${urlSplit[2]})`)
    const module = urlSplit[2].replace(/[^a-z]/g, "")

    if (module === "api") {
      const actionsList = requestData.params
      const responseData: any[] = []
      if (actionsList.length > Config.server.API_request_limit)
        throw new Error(`API request limit reached ${actionsList.length}/${Config.server.API_request_limit}`)

      const xmcStatus = await requestData.checkXMessageCode(false)
      if (xmcStatus === false)
        throw new Error(`Invalid X-Message-Code on multi-API request`)

      await actionsList.forEachAsync(async (params: any, i: number) => {
        params.module = params.module.toLowerCase().replace(/[^a-z]/g, "")
        params.action = params.action.toLowerCase().replace(/[^a-z]/g, "")
        log.verbose(chalk.yellow(`${params.module}/${params.action} [${i + 1}/${actionsList.length}]`), "multi-API")

        const res: IApiMultiResponse = {
          result: {},
          timeStamp: Utils.timeStamp(),
          status: 0,
          commandNum: false
        }
        requestData.params = params
        let result: IAPIResult
        try {
          result = await executeAction(params.module, params.action, requestData, {
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

      await requestData.connection.commit()
      await writeJsonResponse(response, {
        httpStatusCode: 200,
        responseData,
        authToken: requestData.auth_token,
        userId: requestData.user_id,
        xmc: <string>request.headers["x-message-code"],
        nonce: requestData.auth_header.nonce
      })
    } else {
      if (!urlSplit[3]) throw new Error(`Invalid action name (${urlSplit[3]})`)
      const action = urlSplit[3].replace(/[^a-z]/g, "")
      const result: IAPIResult = await executeAction(module, action, requestData, {
        responseType: RESPONSE_TYPE.SINGLE,
        xmc: <string>request.headers["x-message-code"]
      })
      if (result.headers && Object.keys(result.headers).length > 0) {
        for (const key of Object.keys(result.headers)) {
          response.setHeader(key, result.headers[key])
        }
      }

      await requestData.connection.commit()
      await writeJsonResponse(response, {
        httpStatusCode: 200,
        jsonStatusCode: result.status,
        responseData: result.result,
        authToken: requestData.auth_token,
        userId: requestData.user_id,
        xmc: <string>request.headers["x-message-code"],
        nonce: requestData.auth_header.nonce
      })
    }
  } catch (err) {
    await requestData.connection.rollback()
    throw err
  } finally {
    requestData.connection.release()
  }
}
