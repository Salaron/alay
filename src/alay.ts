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
    console.log(await unit.all(`SELECT * FROM unit_m LIMIT 1;`))
  } catch (err) {
    log.fatal(err)
  }
})()

declare global {
  const rootDir: string
}