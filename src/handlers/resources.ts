import { IncomingMessage, ServerResponse } from "http"
import { createReadStream, readFile } from "fs"
import { Log } from "../core/log"
import { promisify } from "util"
import { gzip } from "zlib"
import mime from "mime"

const log = new Log("Resources Handler")

export default async function resourcesHandler(request: IncomingMessage, response: ServerResponse) {
  const rUrl = request.url!.split("?")[0]
  const mimeType = mime.getType(rUrl)
  if (mimeType == null) throw new Error("Unknown type")
  if (rUrl.includes(".js.map")) {
    response.end()
    return
  }
  response.setHeader("Content-Type", mimeType)
  const [, , ...url] = rUrl.split("/")

  if (!Config.server.debug_mode) {
    response.setHeader("Cache-Control", "max-age=21600")
    response.setHeader("Expires", new Date(Date.now() + 21600000).toUTCString())
  }
  if (mimeType.startsWith("image") === true) {
    const stream = createReadStream(`${rootDir}/resources/${url.join("/")}`)
    stream.pipe(response)

    stream.on("error", (err) => {
      stream.destroy()
      log.error(err)
      response.end()
    })
  } else {
    const file = await promisify(readFile)(`${rootDir}/resources/${url.join("/")}`, "UTF-8")

    if (request.headers["accept-encoding"] && request.headers["accept-encoding"]!.indexOf("gzip") != -1) {
      response.setHeader("Content-Encoding", "gzip")
      response.write(await promisify(gzip)(file))
    } else {
      response.write(file)
    }
    response.end()
  }

}
