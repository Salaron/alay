import { IncomingMessage, ServerResponse } from "http"
import { Log } from "../core/log"

// Various handlers
import mainHandler from "./mainHandler"
import webviewHandler from "./webviewHandler"
import webapiHandler from "./webapihandler"
import resourcesHandler from "./resourcesHandler"
import { writeJsonResponse } from "./apiHandler"

const log = new Log("Request Handler")

export default async function requestHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    response.setHeader("X-Powered-By", "SunLight Project v3 (Alay)")
    if (request.url!.includes("favicon.ico")) return response.end() // ignore favicon.ico
    log.verbose(request.method + " " + request.url)
    let urlSplit = request.url!.toLowerCase().split("/")
    if (urlSplit.length < 2) return response.end()
  
    switch (urlSplit[1]) {
      case "main.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "POST" &&
            request.headers["bundle-version"] &&
            request.headers["client-version"] &&
            request.headers["application-id"] &&
            request.headers["authorize"] &&
            request.headers["x-message-code"])
        ) return sendError(`[main.php] Invalid request`)

        if (
          Config.maintenance.force_enabled === true &&
          ![ // allow access to login stuff
            "login/authkey",
            "login/login"
          ].includes(`${urlSplit[2]}/${urlSplit[3]}`) &&
          // check if this user can bypass maintenance
          (!Config.maintenance.bypass.includes(parseInt(<string>request.headers["user-id"])) && 
           !Config.server.admin_ids.includes(parseInt(<string>request.headers["user-id"])))
        ) {
          return writeJsonResponse(response, { maintenanceFlag: true })
        }

        // Bundle is outdate
        if (Utils.versionCompare(<string>request.headers["bundle-version"], Config.client.application_version) === -1) {
          return writeJsonResponse(response, { clientUpdateFlag: true })
        }

        return await mainHandler(request, response)
      }
      case "webview.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "GET")
        ) return sendError(`[webview.php] Invalid request`)
        return await webviewHandler(request, response)
      }
      case "webapi": {
        if (
          !(urlSplit.length == 2 &&
            request.method === "POST" &&
            request.headers["client-version"] &&
            request.headers["authorize"] &&
            request.headers["user-id"]) &&
            request.headers["x-requested-with"] === "XMLHttpRequest"
        ) return sendError(`[webapi] Invalid request`)
        return sendError(`Not implemented yet.`)
        await webapiHandler(request, response)
      }
      case "resources": {
        if (urlSplit[3] === "update.php") {
          response.statusCode = 302
          response.setHeader("Location", "../../webview.php/static/index?id=12")
          return response.end()
        } else if (request.url!.includes("maintenace/maintenance.php")) {
          response.statusCode = 302
          response.setHeader("Location", "../../webview.php/static/index?id=10") // custom
          return response.end()
        }
        return await resourcesHandler(request, response)
      }
      default: { // Not support
        return sendError()
      }
    }
    function sendError(message = "ERROR") {
      response.setHeader("Content-Type", "text/plain")
      response.end(Config.server.debug_mode ? message : "ERROR") // send errors to client only in debug mode
      if (message != "ERROR") throw new Error(message)
    }
  } catch (err) {
    log.error(err)
    response.statusCode = 500
    response.end()
  }
}