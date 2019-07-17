import { Connection, Database, Sqlite3 } from "../core/database"
import Log from "../core/log"
import { Config_ } from "../core/config"
import { Utils_ } from "../common/utils"

declare global {
  // database stuff
  const MySQLconnection: typeof Connection
  const MySQLdatabase: Database
  const sqlite3: Sqlite3
  // log level
  const logLevel: Log.LEVEL
  // various modules
  const Config: Config_
  const Utils: typeof Utils_
}