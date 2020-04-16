import { createReadStream } from "fs"
import { IncomingMessage, ServerResponse } from "http"
import mime from "mime"

export default async function publicHandler(request: IncomingMessage, response: ServerResponse) {
  const pathName = request.url!.split("?")[0]
  const mimeType = mime.getType(pathName)
  if (mimeType == null) throw new Error("Unknown type")

  response.setHeader("Cache-Control", "max-age=21600")
  response.setHeader("Expires", new Date(Date.now() + 21600000).toUTCString())
  const [, , ...path] = pathName.split("/")

  try {
    const stream = createReadStream(`./public/${path.join("/")}`)
    stream.on("error", () => {
      response.setHeader("Content-Type", "text/plain")
      response.statusCode = 404
      response.end("Not found")
    })
    stream.on("end", () => {
      response.end()
    })
    response.setHeader("Content-Type", mimeType)
    stream.pipe(response)
  } catch (err) {
    response.writeHead(404)
    response.end()
  }
}
