import { resolve } from "path"
import * as db from "./core/database"
import Log from "./core/log"
import "./core/config"

const log = new Log.Create(logLevel);
(<any>global).rootDir = `${resolve(__dirname)}/../`;

(async() => {
  try {
    // load config
    await Config.prepareConfig();
    (<any>global).sqlite3 = new db.Sqlite3() // prepare sqlite databases
    let unit = sqlite3.getUnit()
    console.log(await unit.all(``))

  } catch (err) {
    log.fatal(err)
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