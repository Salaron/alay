import { IncomingMessage, ServerResponse } from "http"
import { createReadStream, readFile } from "fs"
import { Log } from "../core/log"
import { promisify } from "util"
import { gzip } from "zlib"
import mime from "mime"

const log = new Log("Resources Handler")

export default async function resourcesHandler(request: IncomingMessage, response: ServerResponse) {
  let mimeType = mime.getType(<string>request.url)
  if (mimeType == null) throw new Error("Unknown type")
  if (request.url!.includes(".js.map")) {
    response.end()
    return
  }
  response.setHeader("Content-Type", mimeType)
  let [, , ...url] = request.url!.split("/")

  if (mimeType.startsWith("image") === true) {
    let stream = createReadStream(`${rootDir}/resources/${url.join("/")}`)
    stream.pipe(response)

    stream.on("error", (err) => {
      stream.destroy()
      log.error(err)
      response.end()
    })
  } else {
    let file = await promisify(readFile)(`${rootDir}/resources/${url.join("/")}`, "UTF-8")

    if (request.headers["accept-encoding"] && request.headers["accept-encoding"]!.indexOf("gzip") != -1) {
      response.setHeader("Content-Encoding", "gzip")
      response.write(await promisify(gzip)(file))
    } else {
      response.write(file)
    }
    response.end()
  }

}