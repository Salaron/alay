import { HANDLER_TYPE, AUTH_LEVEL } from "../types/const"
import { IncomingMessage, ServerResponse } from "http"
import { writeJsonResponse } from "../handlers/apiHandler"
import executeAction from "../handlers/actionHandler"
import RequestData from "../core/requestData"

export default async function webviewHandler(request: IncomingMessage, response: ServerResponse) {
  let requestData = await RequestData.Create(request, response, HANDLER_TYPE.WEBVIEW)
  try {
    // get auth level
    await requestData.getAuthLevel()
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      requestData.resetCookieAuth()
      return await writeJsonResponse(response, {
        httpStatusCode: 403,
        connection: requestData.connection,
        responseData: "An error occurred while processing the request. Please close the current tab and try again",
        direct: true
      })
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED) {
      return await writeJsonResponse(response, {
        httpStatusCode: 423,
        connection: requestData.connection,
        responseData: "You have been banned on this server.",
        direct: true
      })
    }

    // "extract" module & action
    const urlSplit = request.url!.toLowerCase().split(/[?]+/)[0].split("/")
    if (!urlSplit[2] || !urlSplit[3]) throw new Error(`Invalid module/action (${urlSplit[2]}/${urlSplit[3]})`)
    const module = urlSplit[2].replace(/[^a-z]/g, "")
    const action = urlSplit[3].replace(/[^a-z]/g, "")

    let result: ActionResult = await executeAction(module, action, requestData)
    response.setHeader("Content-Type", "text/html; charset=utf-8")
    if (result.headers && Object.keys(result.headers).length > 0) {
      for (let key of Object.keys(result.headers)) {
        response.setHeader(key, result.headers[key])
      }
    }
    response.end(result.result)
    await requestData.connection.commit()
  } catch (err) {
    await requestData.connection.rollback()
    if (err.message.startsWith("No permissions")) return await writeJsonResponse(response, {
      httpStatusCode: 403,
      connection: requestData.connection,
      responseData: "An error occurred while processing the request. Please close the current tab and try again",
      direct: true
    })
    throw err
  }
}