import "./core/config"
import "./handlers/errorHandler"
import { resolve } from "path"
import { MySQLConnect } from "./core/database_wrappers/mysql"
import { Sqlite3 } from "./core/database_wrappers/sqlite3"
import { Log } from "./core/log"
import ReadLine from "./core/readLine"
import http from "http"
import requestHandler from "./handlers/requestHandler"

const log = new Log("Setup");
(<any>global).rootDir = `${resolve(__dirname)}/../`
try {
  // Prepare sqlite3 databases
  (<any>global).sqlite3 = new Sqlite3()
} catch (err) {
  log.fatal(err)
  process.exit(0)
}

// Import common modules (!) after sqlite3
import * as modules from "./common";

// Entry point
(async () => {
  try {
    // Load config
    await Config.prepareConfig()
    // Init readline interface
    ReadLine()
    // Connect to MySQL database
    await MySQLConnect()
    // Prepare common modules
    // execute init function if exists
    for (let module in modules) {
      if ((<any>modules)[module].init) await (<any>modules)[module].init()
    }

    let server = http.createServer(requestHandler)
    server.listen(Config.server.port, Config.server.host, () => {
      let address = server.address() as any
      log.info("Listening on " + address.address + ":" + address.port)
    })
    server.on("error", async (err) => {
      log.fatal(err)
      process.exit(0)
    })
  } catch (err) {
    log.fatal(err)
    process.exit(0)
  }
})()

// like 'forEach' but async
Array.prototype.forEachAsync = async function (callback: <T>(element: T, index: number, originalArray: T[]) => Promise<void>): Promise<void> {
  let array = this
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
// return random value from array
Array.prototype.randomValue = function <T>(): T {
  return this[Math.floor(Math.random() * this.length)]
}
// return object key by value
Object.defineProperty(Object.prototype, "getKey", {
  value: function (value: any) {
    for (let key in this) {
      if (this[key] == value) {
        return key
      }
    }
    return null
  }
})
String.prototype.splice = function (start: number, delCount: number, newSubStr: string) {
  return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount))
}