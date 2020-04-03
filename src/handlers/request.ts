import { IncomingMessage, ServerResponse } from "http"
import { posix } from "path"
import { Utils } from "../common/utils"
import { Logger } from "../core/logger"

// Various handlers
import mainHandler from "./api"
import { writeJsonResponse } from "./response"
import webapiHandler from "./webapi"
import webviewHandler from "./webview"
import publicHandler from "./public"
import { AssertionError } from "assert"
import { RequestError } from "../models/error"

const log = new Logger("Request Handler")

export default async function requestHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    response.setHeader("X-Powered-By", "SunLight Project v3 (Alay)")
    const url = request.url = posix.normalize(request.url || "")

    log.verbose(request.method + " " + request.url)
    const urlSplit = url.toLowerCase().split("/")
    if (urlSplit.length < 2) throw new RequestError("Bad request", 400)

    switch (urlSplit[1]) {
      case "livejson": {
        if (urlSplit.length <= 1 || request.method !== "GET")
          throw new RequestError("Bad request", 400)

        const notesAsset = urlSplit[2]
        if (!notesAsset) throw new RequestError("Invalid note setting asset", 400)
        const liveNotesDB = sqlite3.getLiveNotesSVDB()
        const notes = await liveNotesDB.get("SELECT json FROM live_notes WHERE notes_setting_asset = :notesAsset", {
          notesAsset
        })
        if (!notes) throw new RequestError("Not found", 404)
        response.setHeader("Content-Type", "application/json")
        response.setHeader("Content-Length", Buffer.byteLength(notes.json, "utf-8"))
        response.end(notes.json)
        return
      }

      case "main.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "POST" &&
            request.headers["bundle-version"] &&
            request.headers["client-version"] &&
            request.headers["application-id"] &&
            request.headers["authorize"] &&
            request.headers["x-message-code"]
          )
        ) throw new RequestError("Bad request", 400)

        if (
          Utils.isUnderMaintenance() &&
          // allow access to login
          ![
            "login/authkey",
            "login/login"
          ].includes(`${urlSplit[2]}/${urlSplit[3]}`) &&
          // this user can bypass maintenance?
          !Utils.canBypassMaintenance(parseInt(<string>request.headers["user-id"]))
        ) {
          return writeJsonResponse(response, { maintenanceFlag: true })
        }

        // Bundle version is out of date
        if (Utils.versionCompare(<string>request.headers["bundle-version"], Config.client.application_version) === -1) {
          return writeJsonResponse(response, { clientUpdateFlag: true })
        }

        return await mainHandler(request, response)
      }

      case "webview.php": {
        if (
          !(urlSplit.length >= 3 &&
            request.method === "GET"
          )
        ) throw new RequestError("Bad request", 400)

        if (
          Utils.isUnderMaintenance() &&
          !Utils.canBypassMaintenance(parseInt(<string>request.headers["user-id"])) &&
          !request.url!.includes("webview.php/static/index")
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
            request.headers["authorize"]
          )
        ) throw new RequestError("Bad request", 400)
        return await webapiHandler(request, response)
      }

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
        throw new RequestError("Bad Request", 400)
      }

      case "public": {
        return await publicHandler(request, response)
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
