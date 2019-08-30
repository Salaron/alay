import { Connection as connection, ConnectionPool } from "../core/database_wrappers/mysql"
import { Sqlite3 } from "../core/database_wrappers/sqlite3"
import { config } from "../core/config"
import { Mailer as mailer } from "../core/mailer"
import { ErrorCode as errorCode, ErrorUser as errorUser, ErrorWebApi as errorWebApi } from "../handlers/errorHandler"
import { Utils as utils } from "../common/utils"
import { Type as type } from "../common/type"
import { User as user } from "../common/user"
import { Live as live } from "../common/live"
import { Events as events } from "../common/event"
import { Unit as unit } from "../common/unit"
import { Item as item } from "../common/item"
import { Secretbox as secretbox } from "../common/secretbox"
import { Notice as notice } from "../common/notice"
import { Download as download } from "../common/download"

declare global {
  // make project root dir global (for easy access to files outside of 'compile' folder)
  const rootDir: string
  // database stuff
  const MySQLconnection: typeof connection
  const MySQLconnectionPool: ConnectionPool
  const sqlite3: Sqlite3
  type Connection = connection
  const Config: config
  const Mailer: mailer
  // custom errors for better handling
  const ErrorCode: typeof errorCode
  const ErrorUser: typeof errorUser
  const ErrorWebApi: typeof errorWebApi
  // common modules
  const Utils: typeof utils
  const Type: typeof type
  const User: typeof user
  const Live: typeof live
  const Events: typeof events
  const Unit: typeof unit
  const Item: typeof item
  const Secretbox: typeof secretbox
  const Notice: typeof notice
  const Download: typeof download

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