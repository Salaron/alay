import { Connection, ConnectionPool } from "../core/database_wrappers/mysql"
import { Sqlite3 } from "../core/database_wrappers/sqlite3"
import { config } from "../core/config"
import { Mailer as mailer } from "../core/mailer"
import { ErrorCode as errorCode, ErrorUser as errorUser, ErrorWebApi as errorWebApi } from "../handlers/errorHandler"
import RequestData from "../core/requestData"
import { Type as type} from "../common/type"

import { WebApiAction as WebApiAction_ } from "../models/webApiAction"
import { WebViewAction as WebViewAction_ } from "../models/webViewAction"
import { MainAction as MainAction_ } from "../models/mainAction"

declare global {
  // make project root dir global (for easy access to files outside of 'compile' folder)
  const rootDir: string
  // database stuff
  const MySQLconnection: typeof Connection
  const MySQLconnectionPool: ConnectionPool
  const sqlite3: Sqlite3
  // core modules should be global
  const Config: config
  const Mailer: mailer
  // custom errors for handling
  const ErrorCode: typeof errorCode
  const ErrorUser: typeof errorUser
  const ErrorWebApi: typeof errorWebApi
  // just
  const Type: typeof type
  const WebApiAction: typeof WebApiAction_
  const WebViewAction: typeof WebViewAction_
  const MainAction: typeof MainAction_

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
