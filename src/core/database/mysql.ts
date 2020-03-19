import mysql from "mysql2/promise"
import { promisify } from "util"
import { Logger } from "../logger"

const log = new Logger("MySQL/MariaDB")
export const pool = mysql.createPool({
  ...Object.omit(Config.database.mysql, ["reconnectMaxAttempt", "reconnectDelay"]),
  dateStrings: true,
  namedPlaceholders: true,
  waitForConnections: true
})
export class Connection {

  /**
   * Begin transaction and return instanceof **Connection**
   */
  public static async beginTransaction() {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      return new Connection(connection)
    } catch (err) {
      if (connection) connection.release()
      throw err
    }
  }
  public connection: mysql.PoolConnection
  public released = false
  public lastQuery = ``
  constructor(connection: mysql.PoolConnection) {
    if (!connection) throw new Error(`You should provide a connection`)
    this.connection = connection
  }

  public async execute(query: string, values: any = {}): Promise<any> {
    const result = await this.query(query, values)
    return result
  }

  public async query(query: string, values: any = {}): Promise<any[]> {
    if (this.released) throw new Error(`Connection was released before.\nLast query: ${this.lastQuery}`)
    this.lastQuery = `${query}\n${JSON.stringify(values)}`

    const [rows] = await this.connection.query(query, values)
    return <any[]>rows
  }

  /**
   * Execute query with LIMIT 1 and return first element object.
   */
  public async first(query: string, values: any = {}): Promise<any> {
    if (this.released) throw new Error(`Connection was released before.\nLast query: ${this.lastQuery}`)
    this.lastQuery = `${query}\n${JSON.stringify(values)}`

    // select only 1 element
    const [rows] = await this.connection.query(query, values)
    if (typeof rows === "object" && Array.isArray(rows) && rows.length > 0) {
      return rows[0]
    } else {
      return undefined
    }
  }

  /**
   * Commit and begin transaction again.
   *
   * Note: to save changes you should call **save** or **commit** method again.
   */
  public async save() {
    await this.connection.commit()
    await this.connection.beginTransaction()
  }

  /**
   * Commit changes.
   *
   * @param release release connection after commit (default is false)
   */
  public async commit(release = false) {
    await this.connection.commit()
    if (release) {
      this.connection.release()
      this.released = true
    }
  }

  /**
   * Rollback changes.
   *
   * @param release release connection after commit (default is false)
   */
  public async rollback(release = false) {
    await this.connection.rollback()
    if (release) {
      this.connection.release()
      this.released = true
    }
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
export async function Connect() {
  let connection
  try {
    connection = await pool.getConnection()
    log.info("Connected to MySQL/MariaDB Server")
    reconnectAttempts = 0
  } catch (e) {
    reconnectAttempts += 1
    if (e.code === "ECONNREFUSED")
      log.error(
        `Unable to connect to MySQL/MariaDB Server [ECONNREFUSED] ${reconnectAttempts}/${Config.database.mysql.reconnectMaxAttempt}`
      )
    if (reconnectAttempts >= Config.database.mysql.reconnectMaxAttempt) {
      log.fatal(`Max reconnect attempts reached`)
      process.exit(0)
    }
    await promisify(setTimeout)(Config.database.mysql.reconnectDelay)
    await Connect()
  } finally {
    if (connection) connection.release()
  }
}
