import { IncomingMessage, ServerResponse } from "http"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, HANDLER_TYPE } from "../models/constant"
import { IAPIResult } from "../models/handlers"
import executeAction from "./action"
import { writeJsonResponse } from "./response"

export default async function webviewHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.WEBVIEW)
  try {
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      requestData.resetCookieAuth()
      // TODO: redirect to login page or access allow to page if required auth level is none
      return await writeJsonResponse(response, {
        httpStatusCode: 403,
        responseData: "An error occurred while processing the request. Please close the current tab and try again",
        direct: true
      })
    }
    if (
      requestData.auth_level === AUTH_LEVEL.BANNED &&
      !request.url!.includes("webview.php/static/index?id=") &&
      !request.url!.includes("webview.php/tos/read")
    ) {
      await requestData.connection.rollback()
      response.statusCode = 302
      response.setHeader("Location", "../../webview.php/static/index?id=13")
      return response.end()
    }

    // "extract" module & action
    const urlSplit = request.url!.toLowerCase().split(/[?]+/)[0].split("/")
    if (!urlSplit[2] || !urlSplit[3]) throw new Error(`Invalid module/action (${urlSplit[2]}/${urlSplit[3]})`)
    const moduleName = urlSplit[2].replace(/[^a-z]/g, "")
    const actionName = urlSplit[3].replace(/[^a-z]/g, "")

    const action: IAPIResult = await executeAction(moduleName, actionName, requestData)

    response.setHeader("Content-Type", "text/html; charset=utf-8")
    if (action.headers && Object.keys(action.headers).length > 0) {
      for (const key of Object.keys(action.headers)) {
        response.setHeader(key, action.headers[key])
      }
    }

    await requestData.connection.commit()
    if (action.status !== 200) {
      response.statusCode = action.status
      response.setHeader("Content-Type", "application/json")
      response.write(JSON.stringify(action.result))
    } else {
      response.write(action.result)
    }
    response.end()
  } catch (err) {
    await requestData.connection.rollback()
    throw err
  } finally {
    requestData.connection.release()
  }
}
