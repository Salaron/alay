import { Connection, Database, Sqlite3 } from "../src/core/database"
import Log from "../src/core/log"
import { Config_ } from "../src/core/config"
import { Utils_ } from "../src/common/utils"

declare global {
  // make project root dir global (for easy access to root files)
  const rootDir: string
  // database stuff
  const MySQLconnection: typeof Connection
  const MySQLdatabase: Database
  const sqlite3: Sqlite3
  // log level
  const logLevel: Log.LEVEL
  // various modules
  const Config: Config_
  const Utils: typeof Utils_

  interface Array<T> {
    forEachAsync(callback: (element: T, index: number, originalArray: T[]) => Promise<void>): Promise<void>
    randomValue(): T
  }
  interface Object {
    getKey(key: string | number): string | number
  }
  interface String {
    splice(start: number, delCount: number, newSubStr: string): string
  }
}