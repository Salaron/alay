import mariadb from "mariadb"
import { promisify } from "util"
import { Log } from "../log"
import { formatQuery } from "./query"

const log = new Log("MariaDB")
export const pool = mariadb.createPool(Config.database)

export class Connection {
  public connection: mariadb.PoolConnection
  public released = false
  public lastQuery = ``
  constructor(connection: mariadb.PoolConnection) {
    if (!connection) throw new Error(`You should provide a connection`)
    this.connection = connection
  }

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

  public async execute(query: string, values: any = {}): Promise<any> {
    return await this.query(query, values)
  }

  public async query(query: string, values: any = {}): Promise<any[]> {
    if (this.released) throw new Error(`Connection was released before.\nLast query: ${this.lastQuery}`)
    this.lastQuery = `${query}\n${JSON.stringify(values)}`

    return await this.connection.query(formatQuery(query, values))
  }

  /**
   * Execute query with LIMIT 1 and return first element object.
   */
  public async first(query: string, values: any = {}): Promise<any> {
    if (this.released) throw new Error(`Connection was released before.\nLast query: ${this.lastQuery}`)
    this.lastQuery = `${query}\n${JSON.stringify(values)}`

    if (query.slice(-1) === ";") query = query.slice(0, -1) // remove ";" -- the end of query
    // select only 1 element
    const result = await this.connection.query(formatQuery(query, values) + " LIMIT 1;")
    if (typeof result === "object" && Array.isArray(result) && result.length > 0) {
      return result[0]
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
   * Commit changes and release connection.
   */
  public async commit() {
    await this.connection.commit()
    this.connection.release()
    this.released = true
  }

  public async rollback(release = true) {
    await this.connection.rollback()
    if (release) {
      this.connection.release()
      this.released = true
    }
  }
}

let reconnectAttempts = 0
export async function Connect() {
  let connection
  try {
    connection = await pool.getConnection()
    log.info("Connected to MariaDB Server")
    reconnectAttempts = 0
  } catch (e) {
    reconnectAttempts += 1
    if (e.code === "ECONNREFUSED")
      log.error(
        `Unable to connect to MariaDB Server [ECONNREFUSED] ${reconnectAttempts}/${Config.database.reconnectMaxAttempt}`
      )
    if (reconnectAttempts >= Config.database.reconnectMaxAttempt) {
      log.fatal(`Max reconnect attempts reached`)
      process.exit(0)
    }
    await promisify(setTimeout)(Config.database.reconnectDelay)
    await Connect()
  } finally {
    if (connection) connection.release()
  }
}