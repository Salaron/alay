import { HANDLER_TYPE, AUTH_LEVEL, RESPONSE_TYPE } from "../../types/const"
import { IncomingMessage, ServerResponse } from "http"
import { writeJsonResponse } from "../handlers/apiHandler"
import executeAction from "../handlers/actionHandler"
import RequestData from "../core/requestData"
import Log from "../core/log"
import chalk from "chalk"

const log = new Log.Create(logLevel, "Main Handler")

export default async function moduleHandler(request: IncomingMessage, response: ServerResponse) {
  let requestData = await RequestData.Create(request, response, HANDLER_TYPE.MAIN)
  // get auth level
  await requestData.getAuthLevel()
  if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
    return await writeJsonResponse(response, {
      httpStatusCode: 403,
      connection: requestData.connection
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
  const urlSplit = request.url!.toLowerCase().split("/")
  const module = urlSplit[2].replace(/[^a-z]/g, "")
  const action = urlSplit[3].replace(/[^a-z]/g, "")

  switch (module) {
    case "api": {
      let api = JSON.parse(requestData.formData)
      if (api.length > Config.server.API_request_limit) throw new ErrorUser(`[mainHandler] API request limit reached ${api.length}/${Config.server.API_request_limit}`, requestData.user_id)

      let responseData: any[] = []

      let xmcStatus = await requestData.checkXMC(false)
      if (xmcStatus === false) throw new ErrorUser(`[mainHandler] Invalid X-Message-Code; user #${requestData.user_id}`, requestData.user_id)

      await api.forEachAsync(async (data: any) => {
        await log.verbose(chalk.yellow(data.module + "/" + data.action), "api/multirequest")
        let response: MultiResponse = {
          result: {},
          timeStamp: Utils.timeStamp(),
          status: 0,
          commandNum: false
        }
        requestData.formData = data
        let result: ActionResult
        try {
          result = await executeAction(data.module, data.action, requestData, {
            responseType: RESPONSE_TYPE.MULTI, 
            xmc: <string>request.headers["x-message-code"]
          })
        } catch (err) {
          log.error(err)
          response.status = 600
          return responseData.push(response)
        }

        response.status = result.status
        response.result = result.result
        responseData.push(response)
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
      let result: ActionResult = await executeAction(module, action, requestData, {
        responseType: RESPONSE_TYPE.SINGLE, 
        xmc: <string>request.headers["x-message-code"]
      })

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
}