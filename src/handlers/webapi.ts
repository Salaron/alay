import { IncomingMessage, ServerResponse } from "http"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, HANDLER_TYPE } from "../models/constant"
import { ErrorWebAPI } from "../models/error"
import executeAction from "./action"
import { writeJsonResponse } from "./response"

export default async function webapiHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.WEBAPI)
  try {
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      throw new ErrorWebAPI("An error occurred while processing the request. Please close the current tab and try again")
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED) {
      throw new ErrorWebAPI("You have been banned on this server")
    }

    // "extract" module & action
    const urlSplit = request.url!.toLowerCase().split(/[?]+/)[0].split("/")
    if (!urlSplit[2] || !urlSplit[3]) throw new Error(`Invalid module/action (${urlSplit[2]}/${urlSplit[3]})`)
    const module = urlSplit[2].replace(/[^a-z]/g, "")
    const action = urlSplit[3].replace(/[^a-z]/g, "")

    const result = await executeAction(module, action, requestData)
    if (result.headers && Object.keys(result.headers).length > 0) {
      for (const key of Object.keys(result.headers)) {
        response.setHeader(key, result.headers[key])
      }
    }
    await requestData.connection.commit()
    await writeJsonResponse(response, {
      httpStatusCode: result.status,
      responseData: result.result,
      authToken: requestData.auth_token,
      userId: requestData.user_id,
      nonce: requestData.auth_header.nonce
    })
  } catch (err) {
    await requestData.connection.rollback()
    if (err instanceof ErrorWebAPI) {
      await writeJsonResponse(response, {
        responseData: err.response,
        direct: true,
        httpStatusCode: 600
      })
      return
    }
    throw err
  } finally {
    requestData.connection.release()
  }
}
