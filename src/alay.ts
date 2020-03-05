import "./global"
import "./core/config"
import "./models/error"
import { Logger } from "./core/logger"
import { Sqlite3 } from "./core/database/sqlite3"
import { Connect } from "./core/database/mysql"

const logger = new Logger("Setup")
try {
  // Prepare sqlite3 databases
  (<any>global).sqlite3 = new Sqlite3()
} catch (err) {
  logger.fatal(err)
  process.exit(0)
}

import ReadLine from "./core/readLine"
import http from "http"
import requestHandler from "./handlers/request"
import * as modules from "./common"
import { AddressInfo } from "net"
import { Gris } from "./core/gris"

// Entry point
(async () => {
  // Load config
  await Config.prepareConfig()
  // Decrypt release info rows
  await sqlite3.decryptReleaseInfo()
  // Init readline interface
  ReadLine()
  // Connect to MySQL/MariaDB database
  await Connect()
  // Prepare common modules
  // execute init function if exists
  for (const module in modules) {
    if ((<any>modules)[module].init) await (<any>modules)[module].init()
  }

  const server = http.createServer(requestHandler)
  server.listen(Config.server.port, Config.server.host, async () => {
    const address = server.address() as AddressInfo
    logger.info(`Listening on ${address.address}:${address.port}`)

    if (Config.gris.enabled) {
      // Connect to official server
      try {
        const gris = new Gris()
        await gris.prepare()
        await gris.executeQueue()
      } catch (err) {
        logger.error(err.message, "Gris")
      }
    } else {
      logger.warn("Gris is disabled. 'download/*' actions may not work properly")
    }
  })
  server.on("error", async (err) => {
    logger.fatal(err)
    process.exit(0)
  })
})().catch(err => {
  logger.error(err)
  process.exit(0)
})
