import { resolve } from "path"
import * as db from "./core/database"

declare global {
  const rootDir: string
}
(<any>global).rootDir = `${resolve(__dirname)}/../`;
(<any>global).sqlite3 = new db.Sqlite3();

(async() => {
  let unit = sqlite3.getUnit()
  console.log(await unit.all(`SELECT * FROM unit_m LIMIT 1;`))
})()