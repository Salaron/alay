import { Connection as Connection_, ConnectionPool, Sqlite3 } from "../core/database"
import { config } from "../core/config"
import { ErrorCode as errorCode, ErrorUser as errorUser } from "../handlers/errorHandler"
import { Utils as utils } from "../common/utils"
import { Type as type } from "../common/type"
import { User as user } from "../common/user"
import { Live as live } from "../common/live"

declare global {
  // make project root dir global (for easy access to files outside of 'compile' folder)
  const rootDir: string
  // database stuff
  const MySQLconnection: typeof Connection_
  const MySQLconnectionPool: ConnectionPool
  const sqlite3: Sqlite3
  // various modules
  const Config: config
  const Utils: typeof utils
  const ErrorCode: typeof errorCode
  const ErrorUser: typeof errorUser
  const Type: typeof type
  const User: typeof user
  const Live: typeof live

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