import { Connection as Connection_, ConnectionPool, Sqlite3 } from "../core/database"
import Log from "../core/log"
import { config } from "../core/config"
import { ErrorCode as errorCode, ErrorUser as errorUser } from "../handlers/errorHandler"
import { Utils as utils } from "../common/utils"
import { Type as type_ } from "../common/type"

declare global {
  // make project root dir global (for easy access to root files)
  const rootDir: string
  // database stuff
  const MySQLconnection: typeof Connection_
  const MySQLconnectionPool: ConnectionPool
  const sqlite3: Sqlite3
  // log level
  const logLevel: Log.LEVEL
  // various modules
  const Config: config
  const Utils: typeof utils
  const ErrorCode: typeof errorCode
  const ErrorUser: typeof errorUser
  const Type: typeof type_

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