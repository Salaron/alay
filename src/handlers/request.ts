import { IncomingMessage, ServerResponse } from "http"
import { posix } from "path"
import { Utils } from "../common/utils"
import { Logger } from "../core/logger"

// Various handlers
import mainHandler from "./api"
import resourcesHandler from "./resources"
import { writeJsonResponse } from "./response"
import webapiHandler from "./webapi"
import webviewHandler from "./webview"
import { AssertionError } from "assert"
import { RequestError } from "../models/error"

const log = new Logger("Request Handler")

export default async function requestHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    response.setHeader("X-Powered-By", "SunLight Project v3 (Alay)")
    request.url = posix.normalize(request.url || "")

    // ignore favicon.ico for now
    if (request.url!.includes("favicon.ico")) {
      response.statusCode = 404
      return response.end()
    }
    log.verbose(request.method + " " + request.url)
    const urlSplit = request.url!.toLowerCase().split("/")
    if (urlSplit.length < 2) return response.end()

    switch (urlSplit[1]) {
      case "livejson": {
        if (urlSplit.length <= 1 || request.method !== "GET")
          throw new RequestError("Bad request", 400)

        const notesAsset = request.url!.split("/")[2]
        if (!notesAsset) throw new RequestError("Invalid note setting asset", 400)
        const liveDB = sqlite3.getLive()
        const liveNotesDB = sqlite3.getNotes()

        const live = await liveDB.get("SELECT live_setting_id FROM live_setting_m WHERE notes_setting_asset = :notesAsset", {
          notesAsset
        })
        if (!live) throw new RequestError("Not found", 404)
        const notes = await liveNotesDB.all(`
          SELECT
            timing_sec, notes_attribute, notes_level,
            effect, effect_value, position FROM live_note
          WHERE live_setting_id = :id`, {
          id: live.live_setting_id
        })
        const jsonResult = JSON.stringify(notes)
        response.setHeader("Content-Type", "application/json")
        response.setHeader("Content-Length", Buffer.byteLength(jsonResult, "utf-8"))
        response.write(jsonResult)
        response.end()
        return
      }

      case "main.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "POST" &&
            request.headers["bundle-version"] &&
            request.headers["client-version"] &&
            request.headers["application-id"] &&
            request.headers.authorize &&
            request.headers["x-message-code"])
        ) throw new RequestError("Bad request", 400)

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
        ) throw new RequestError("Bad request", 400)

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
        ) throw new RequestError("Bad request", 400)
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
      default: {
        throw new RequestError("Not implemented", 501)
      }
    }
  } catch (err) {
    if (err instanceof AssertionError) {
      await writeJsonResponse(response, {
        responseData: {
          error_code: 1234
        },
        httpStatusCode: 600
      })
      return
    }

    if (err instanceof RequestError) {
      await writeJsonResponse(response, {
        responseData: {
          message: err.message
        },
        direct: true,
        httpStatusCode: err.statusCode
      })
      return
    }

    if (!isNaN(parseInt(<string>request.headers["user-id"]))) {
      let msg = ""
      msg += `${err.message}; UserId: ${request.headers["user-id"]}`
      err.stack = err.stack.replace(err.message, msg)
    }
    log.error(err.stack)
    await writeJsonResponse(response, {
      responseData: Config.server.debug_mode ? { message: err.message } : { message: "Internal Server Error" },
      direct: true,
      httpStatusCode: 500
    })
  }
}
