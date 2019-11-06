import { Type as type } from "../common/type"
import { config } from "../core/config"
import { Sqlite3 } from "../core/database/sqlite3"
import { Mailer as mailer } from "../core/mailer"
import { ApiAction as apiAction, WebApiAction as webApiAction, WebViewAction as webViewAction } from "../models/actions"
import { ErrorCode as errorCode, ErrorUser as errorUser, ErrorWebApi as errorWebApi } from "../models/error"

declare global {
  // make project root dir global (for easy access to files outside of 'compile' folder)
  const rootDir: string

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
  const WebApiAction: typeof webApiAction
  const WebViewAction: typeof webViewAction
  const ApiAction: typeof apiAction

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
