import mysql from "mysql"
import { promisify } from "util"
import { Logger } from "../logger"
import { formatQuery } from "./query"

const log = new Logger("MySQL/MariaDB")
export const pool = mysql.createPool({
  ...Object.omit(Config.database, ["reconnectMaxAttempt", "reconnectDelay"]),
  dateStrings: true,
  waitForConnections: true,
  queryFormat: formatQuery
})
export class Connection {

  /**
   * Begin transaction and return instanceof **Connection**
   */
  public static beginTransaction(): Promise<Connection> {
    return new Promise((res, rej) => {
      pool.getConnection((err, connection) => {
        if (err) return rej(err)
        connection.beginTransaction(err => {
          if (err) return rej(err)

          res(new Connection(connection))
        })
      })
    })
  }
  public connection: mysql.PoolConnection
  public released = false
  public lastQuery = ``

  constructor(connection: mysql.PoolConnection) {
    if (!connection) throw new Error(`You should provide a connection`)
    this.connection = connection
  }

  public async execute(query: string, values: any = {}): Promise<any> {
    const okPacket = await this.query(query, values)
    return okPacket
  }

  public query(query: string, values: any = {}): Promise<any[]> {
    return new Promise((res, rej) => {
      this.connection.query(query, values, (err, rows) => {
        if (err) return rej(err)

        res(rows)
      })
    })
    if (this.released) throw new Error(`Connection was released before.\nLast query: ${this.lastQuery}`)
    this.lastQuery = `${query}\n${JSON.stringify(values)}`
  }

  /**
   * Execute query with LIMIT 1 and return first element object.
   */
  public async first(query: string, values: any = {}): Promise<any | undefined> {
    // select only 1 element
    const rows = await this.query(query, values)
    if (typeof rows === "object" && Array.isArray(rows) && rows.length > 0) {
      return rows[0]
    } else {
      return undefined
    }
  }

  /**
   * Commit changes.
   *
   * @param release release connection after commit (default is false)
   */
  public commit(release = false): Promise<void> {
    return new Promise((res, rej) => {
      this.connection.commit((err) => {
        if (err) return rej(err)
        if (release) {
          this.connection.release()
          this.released = true
        }
        res()
      })
    })
  }

  /**
   * Rollback changes.
   *
   * @param release release connection after commit (default is false)
   */
  public async rollback(release = false): Promise<void> {
    return new Promise((res, rej) => {
      this.connection.rollback(err => {
        if (err) return rej(err)
        if (release) {
          this.connection.release()
          this.released = true
        }
        res()
      })
    })
  }

  /**
   * Release this connection.
   */
  public release() {
    this.connection.release()
    this.released = true
  }
}

let reconnectAttempts = 0
export function Connect() {
  return new Promise((res, rej) => {
    pool.getConnection((err, connection) => {
      if (err) return rej(err)

      log.info("Connected to MySQL/MariaDB Server")
      reconnectAttempts = 0
      connection.release()
      res()
    })
  }).catch(async err => {
    reconnectAttempts += 1
    if (err.code === "ECONNREFUSED")
      log.error(
        `Unable to connect to MySQL/MariaDB Server [ECONNREFUSED] ${reconnectAttempts}/${Config.database.reconnectMaxAttempt}`
      )
    if (reconnectAttempts >= Config.database.reconnectMaxAttempt) {
      log.fatal(`Max reconnect attempts reached`)
      process.exit(0)
    }
    await promisify(setTimeout)(Config.database.reconnectDelay)
    await Connect()
  })
}
