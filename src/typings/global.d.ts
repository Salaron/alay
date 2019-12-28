import { Type as type } from "../common/type"
import { config } from "../core/config"
import { Sqlite3 } from "../core/database/sqlite3"
import { ApiAction as apiAction, WebApiAction as webApiAction, WebViewAction as webViewAction } from "../models/actions"

declare global {
  const sqlite3: Sqlite3
  // core modules should be global
  const Config: config
  // just
  const Type: typeof type
  const WebApiAction: typeof webApiAction
  const WebViewAction: typeof webViewAction
  const ApiAction: typeof apiAction

  interface Array<T> {
    /**
     * Like *forEach* but async
     */
    forEachAsync(callback: (element: T, index: number, originalArray: T[]) => Promise<void>): Promise<void>
    /**
     * Returns random element from Array
     */
    randomValue(): T
  }
  interface Object {
    getKey(key: string | number): string | number
  }
  interface ObjectConstructor {
    /**
     * Remove property(-ies) from Object
     * @returns new object w/o specified props
     */
    omit<T, K extends string>(object: T, props: K[] | K): Omit<T, K>
  }
  interface String {
    splice(start: number, delCount: number, newSubStr: string): string
  }
}
