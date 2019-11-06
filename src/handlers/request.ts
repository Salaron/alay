import { IncomingMessage, ServerResponse } from "http"
import { Log } from "../core/log"

// Various handlers
import mainHandler from "./api"
import webviewHandler from "./webview"
import webapiHandler from "./webapi"
import resourcesHandler from "./resources"
import { writeJsonResponse } from "./response"
import { Utils } from "../common/utils"

const log = new Log("Request Handler")

export default async function requestHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    response.setHeader("X-Powered-By", "SunLight Project v3 (Alay)")
    request.url = request.url!.split("../").join("")
    if (request.url!.includes("favicon.ico")) return response.end() // ignore favicon.ico
    log.verbose(request.method + " " + request.url)
    const urlSplit = request.url!.toLowerCase().split("/")
    if (urlSplit.length < 2) return response.end()

    switch (urlSplit[1]) {
      case "main.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "POST" &&
            request.headers["bundle-version"] &&
            request.headers["client-version"] &&
            request.headers["application-id"] &&
            request.headers.authorize &&
            request.headers["x-message-code"])
        ) throw new Error("nope")

        if (
          Utils.isUnderMaintenance() &&
          ![ // allow access to login stuff
            "login/authkey",
            "login/login"
          ].includes(`${urlSplit[2]}/${urlSplit[3]}`) &&
          // this user can bypass maintenance?
          !Utils.canBypassMaintenance(parseInt(<string>request.headers["user-id"]))
        ) {
          return writeJsonResponse(response, { maintenanceFlag: true })
        }

        // Bundle version is outdate
        if (Utils.versionCompare(<string>request.headers["bundle-version"], Config.client.application_version) === -1) {
          return writeJsonResponse(response, { clientUpdateFlag: true })
        }

        return await mainHandler(request, response)
      }
      case "webview.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "GET")
        ) throw new Error("nope")

        if (
          Utils.isUnderMaintenance() &&
          !Utils.canBypassMaintenance(parseInt(<string>request.headers["user-id"])) &&
          !request.url!.includes("webview.php/static/index?id=10")
        ) {
          response.statusCode = 302
          response.setHeader("Location", "../../webview.php/static/index?id=10") // custom maintenance page
          return response.end()
        }
        return await webviewHandler(request, response)
      }
      case "webapi": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "POST" &&
            request.headers["client-version"] &&
            request.headers.authorize) &&
          request.headers["x-requested-with"] === "XMLHttpRequest"
        ) throw new Error("nope")
        return await webapiHandler(request, response)
      }
      // If you'll use reverse-proxy, then don't forget to add path maintenace/* to exceptions
      case "resources": {
        if (request.url!.includes("maintenace/update.php")) {
          response.statusCode = 302
          response.setHeader("Location", "../../webview.php/static/index?id=12") // redirect to update page
          return response.end()
        } else if (
          request.url!.includes("maintenace/maintenance.php") &&
          Utils.isUnderMaintenance() &&
          !Utils.canBypassMaintenance(parseInt(<string>request.headers["user-id"]))
        ) {
          response.statusCode = 302
          response.setHeader("Location", "../../webview.php/static/index?id=10") // custom maintenance page
          return response.end()
        } else if (request.url!.includes("maintenace/maintenance.php") && Config.modules.login.webview_login) {
          response.statusCode = 302
          response.setHeader("Location", "../../webview.php/login/hello") // Webview login
          return response.end()
        }
        return await resourcesHandler(request, response)
      }
      default: { // Not support
        throw new Error("nope")
      }
    }
  } catch (err) {
    if (err.message != "nope") log.error(err)
    await writeJsonResponse(response, {
      responseData: Config.server.debug_mode ? { message: err.message } : { message: "Internal Server Error" },
      direct: true,
      httpStatusCode: 500
    })
  }
}