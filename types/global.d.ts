import { Connection as Connection_, database, Sqlite3 } from "../src/core/database"
import Log from "../src/core/log"
import { config } from "../src/core/config"
import { ErrorCode as errorCode } from "../src/handlers/errorHandler"
import { Utils as utils } from "../src/common/utils"

declare global {
  // make project root dir global (for easy access to root files)
  const rootDir: string
  // database stuff
  const MySQLconnection: typeof Connection_
  const MySQLdatabase: database
  const sqlite3: Sqlite3
  // log level
  const logLevel: Log.LEVEL
  // various modules
  const Config: config
  const Utils: typeof utils
  const ErrorCode: typeof errorCode

  type Connection = Connection_

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