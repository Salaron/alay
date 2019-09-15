import { HANDLER_TYPE, AUTH_LEVEL } from "../core/requestData"
import { IncomingMessage, ServerResponse } from "http"
import { writeJsonResponse } from "../handlers/apiHandler"
import executeAction from "../handlers/actionHandler"
import RequestData from "../core/requestData"

export default async function webapiHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.WEBAPI)
  try {
    // get auth level
    await requestData.getAuthLevel()
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      return await writeJsonResponse(response, {
        httpStatusCode: 600,
        connection: requestData.connection,
        responseData: {
          message: "An error occurred while processing the request. Please close the current tab and try again"
        }
      })
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED) {
      return await writeJsonResponse(response, {
        httpStatusCode: 600,
        connection: requestData.connection,
        responseData: {
          message: "You have been banned on this server"
        }
      })
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
    return writeJsonResponse(response, {
      httpStatusCode: result.status,
      responseData: result.result,
      authToken: requestData.auth_token,
      userId: requestData.user_id,
      encoding: <string>request.headers["accept-encoding"],
      nonce: requestData.auth_header.nonce,
      connection: requestData.connection
    })
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
  }
}
