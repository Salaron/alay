import "./core/config"
import { resolve } from "path"
import * as db from "./core/database"
import Log from "./core/log"
import http from "http"
import requestHandler from "./handlers/requestHandler"

import * as modules from "./common"
console.log(modules)

const log = new Log.Create(logLevel, "Setup");
(<any>global).rootDir = `${resolve(__dirname)}/../`;

// Entry point
(async() => {
  try { 
    // Load config
    await Config.prepareConfig();
    // Prepare sqlite databases
    (<any>global).sqlite3 = new db.Sqlite3()
    // tests
    let live = sqlite3.getLive()
    console.log(await live.get(`SELECT * FROM live_setting_m WHERE live_setting_id = :ls`, { ls: 1 }))
    await live.close()
    live = sqlite3.getLive()
    console.log(await live.get(`SELECT * FROM live_setting_m WHERE live_setting_id = ?`, [1]))

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
Array.prototype.forEachAsync = async function(callback: <T>(element: T, index: number, originalArray: T[]) => Promise<void>): Promise<void> {
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