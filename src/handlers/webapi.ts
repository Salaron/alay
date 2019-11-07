import { IncomingMessage, ServerResponse } from "http"
import { writeJsonResponse } from "./response"
import executeAction from "./action"
import RequestData from "../core/requestData"
import { HANDLER_TYPE, AUTH_LEVEL } from "../models/constant"

export default async function webapiHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.WEBAPI)
  try {
    await requestData.getAuthLevel()
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      await writeJsonResponse(response, {
        httpStatusCode: 600,
        responseData: {
          message: "An error occurred while processing the request. Please close the current tab and try again"
        }
      })
      return await requestData.connection.commit()
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED) {
      await writeJsonResponse(response, {
        httpStatusCode: 600,
        responseData: {
          message: "You have been banned on this server"
        }
      })
      return await requestData.connection.commit()
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
    await writeJsonResponse(response, {
      httpStatusCode: result.status,
      responseData: result.result,
      authToken: requestData.auth_token,
      userId: requestData.user_id,
      encoding: <string>request.headers["accept-encoding"],
      nonce: requestData.auth_header.nonce
    })
    await requestData.connection.commit()
  } catch (err) {
    await requestData.connection.rollback()
    if (err instanceof ErrorWebApi && err.sendToClient === true) {
      await writeJsonResponse(response, {
        responseData: { message: err.message },
        direct: true,
        httpStatusCode: 600
      })
      return
    }
    throw err
  } finally {
    requestData.connection.connection.release()
  }
}
