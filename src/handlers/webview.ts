import { IncomingMessage, ServerResponse } from "http"
import { writeJsonResponse } from "./response"
import executeAction from "./action"
import RequestData from "../core/requestData"
import { promisify } from "util"
import { gzip } from "zlib"
import { IApiResult } from "../models/handlers"
import { HANDLER_TYPE, AUTH_LEVEL } from "../models/constant"

export default async function webviewHandler(request: IncomingMessage, response: ServerResponse) {
  const requestData = await RequestData.Create(request, response, HANDLER_TYPE.WEBVIEW)
  try {
    // get auth level
    await requestData.getAuthLevel()
    if (requestData.auth_level === AUTH_LEVEL.REJECTED || requestData.auth_level === AUTH_LEVEL.SESSION_EXPIRED) {
      requestData.resetCookieAuth()
      // TODO: redirect to login page or access allow to page if required auth level is none
      return await writeJsonResponse(response, {
        httpStatusCode: 403,
        connection: requestData.connection,
        responseData: "An error occurred while processing the request. Please close the current tab and try again",
        direct: true
      })
    }
    if (requestData.auth_level === AUTH_LEVEL.BANNED &&
      !request.url!.includes("webview.php/static/index?id=") &&
      !request.url!.includes("webview.php/tos/read")) {
      await requestData.connection.rollback()
      response.statusCode = 302
      response.setHeader("Location", "../../webview.php/static/index?id=13") // user banned page
      return response.end()
    }

    // "extract" module & action
    const urlSplit = request.url!.toLowerCase().split(/[?]+/)[0].split("/")
    if (!urlSplit[2] || !urlSplit[3]) throw new Error(`Invalid module/action (${urlSplit[2]}/${urlSplit[3]})`)
    const module = urlSplit[2].replace(/[^a-z]/g, "")
    const action = urlSplit[3].replace(/[^a-z]/g, "")

    const result: IApiResult = await executeAction(module, action, requestData)
    response.setHeader("Content-Type", "text/html; charset=utf-8")
    if (result.headers && Object.keys(result.headers).length > 0) {
      for (const key of Object.keys(result.headers)) {
        response.setHeader(key, result.headers[key])
      }
    }

    if (request.headers["accept-encoding"] && request.headers["accept-encoding"]!.indexOf("gzip") != -1) {
      response.setHeader("Content-Encoding", "gzip")
      result.result = await promisify(gzip)(result.result)
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
