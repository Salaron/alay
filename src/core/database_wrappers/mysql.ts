import * as mysql from "mysql"
import { Log, LEVEL } from "../log"
import extend from "extend"
import { promisify } from "util"

const log = new Log("MySQL")
interface PoolConfig extends mysql.PoolConfig {
  autoReconnect: boolean;
  autoReconnectMaxAttempt: number;
  autoReconnectDelay: number;
  disconnected: any;
}

export class ConnectionPool {
  public config: PoolConfig;
  public pool: mysql.Pool;
  public reconnectAttempts: number;
  public freeConnections: mysql.PoolConnection[];
  public createdConnections: mysql.PoolConnection[];
  public acquiringConnections: mysql.PoolConnection[];
  private debugInterval: any;
  constructor(config: Database) {
    this.config = extend(
      {
        autoReconnect: true,
        autoReconnectDelay: 1000,
        autoReconnectMaxAttempt: 10,
        disconnected: () => {}, // tslint:disable-line
        dateStrings: true,
        queryFormat: formatQuery,
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        connectionLimit: 30
      },
      config
    )
    this.reconnectAttempts = 0
  }

  public async connect(): Promise<void> {
    return new Promise(async (res, rej) => {
      try {
        this.pool = mysql.createPool(this.config)
        this.pool.on("error", async (err) => {
          await this.handleError(err)
        })

        const connection = await Connection.get()
        await Promise.all([
          connection.query(`SET names utf8mb4`),
          connection.query(`SET SESSION group_concat_max_len = 4294967295`) // max of int32
        ])
        await connection.commit()

        this.reconnectAttempts = 0
        this.freeConnections = (<any>this.pool)._freeConnections
        this.createdConnections = (<any>this.pool)._allConnections
        this.acquiringConnections = (<any>this.pool)._acquiringConnections
        res()
      } catch (err) {
        await this.handleError(err)
        rej(err)
      }
    })
  }

  public async beginTransaction(
    connection?: mysql.PoolConnection
  ): Promise<mysql.PoolConnection> {
    return new Promise(async (res, rej) => {
      try {
        if (connection === undefined) connection = await this.getConnection()
      } catch (err) {
        if (
          connection != undefined &&
          this.freeConnections.indexOf(connection) === -1
        )
          connection.release()
        return rej(err)
      }
      connection.beginTransaction(async (err) => {
        if (err) {
          if (
            connection != undefined &&
            this.freeConnections.indexOf(connection) === -1
          )
            connection.release()
          return rej(err)
        }
        res(connection)
      })
    })
  }
  public async commit(
    connection: mysql.PoolConnection,
    release = true
  ): Promise<void> {
    return new Promise(async (res, rej) => {
      connection.commit(async (err) => {
        if (err) {
          if (
            this.freeConnections.indexOf(connection) === -1 &&
            release == true
          )
            connection.release()
          return rej(err)
        }
        if (release == true) connection.release()
        res()
      })
    })
  }
  public async rollback(
    connection: mysql.PoolConnection,
    release = true
  ): Promise<void> {
    return new Promise(async (res, rej) => {
      connection.rollback(async (err) => {
        if (err) {
          if (
            this.freeConnections.indexOf(connection) === -1 &&
            release == true
          )
            connection.release()
          return rej(err)
        }
        if (release == true) connection.release()
        res()
      })
    })
  }

  public async query(
    query: string,
    values: any = {},
    connection?: mysql.PoolConnection,
    ignoreErrors?: boolean
  ): Promise<any[]> {
    return new Promise(async (res, rej) => {
      let transaction = false
      try {
        if (connection == undefined) connection = await this.getConnection()
        else transaction = true
      } catch (err) {
        if (
          connection != undefined &&
          this.freeConnections.indexOf(connection) === -1 &&
          !transaction
        )
          connection.release()
        return rej(err)
      }
      (<mysql.PoolConnection>connection).query(
        query,
        values,
        async (err, result) => {
          if (!transaction) (<mysql.PoolConnection>connection).release()
          if (err) {
            if (!ignoreErrors)
              log.error(
                `The error has occurred while performing a query:\n"${query}" with this values: ${JSON.stringify(
                  values
                )}`
              )
            return rej(err)
          }
          res(result)
        }
      )
    })
  }
  public async first(
    query: string,
    values: any = {},
    connection?: mysql.PoolConnection,
    ignoreErrors?: boolean
  ): Promise<any> {
    return new Promise(async (res, rej) => {
      let transaction = false
      try {
        if (connection == undefined) connection = await this.getConnection()
        else transaction = true
      } catch (err) {
        if (
          connection != undefined &&
          this.freeConnections.indexOf(connection) === -1 &&
          !transaction
        )
          connection.release()
        return rej(err)
      }

      if (query.slice(-1) === ";") query = query.slice(0, -1) // remove ";" -- the end of query
      // select only 1 element
      connection.query(query + " LIMIT 1;", values, async (err, result) => {
        if (!transaction) (<mysql.PoolConnection>connection).release()
        if (err) {
          if (!ignoreErrors)
            log.error(
              `The error has occurred while performing a query:\n"${query}" with this values: ${JSON.stringify(
                values
              )}`
            )
          return rej(err)
        }
        if (typeof result === "object" && Array.isArray(result)) {
          if (result.length > 0) result = result[0]
          else result = undefined
        }
        res(result)
      })
    })
  }

  public connectionDebug(interval = 3000) {
    if (
      typeof this.debugInterval === "undefined" &&
      Config.server.log_level >= LEVEL.DEBUG
    ) {
      log.debug(`Pool Connection Debug Info Enabled`)
      this.debugInterval = setInterval(() => {
        log.debug(
          `Pool connection limit: ${MySQLconnectionPool.config.connectionLimit}`
        )
        log.debug(`Created connections: ${this.createdConnections.length}`)
        log.debug(`Free connections: ${this.freeConnections.length}`)
        log.debug(`Active connections: ${this.acquiringConnections.length}`)
      }, interval)
    } else {
      clearInterval(this.debugInterval)
      this.debugInterval = undefined
      log.debug(`Pool Connection Debug Info Disabled`)
    }
  }

  private async getConnection(): Promise<mysql.PoolConnection> {
    return new Promise((res, rej) => {
      this.pool.getConnection(async (err, connection) => {
        if (err) {
          rej(err)
        }
        res(connection)
      })
    })
  }

  private async handleError(error: mysql.MysqlError): Promise<void> {
    log.error(error.message + " [" + error.code + "]")
    switch (error.code) {
      case "ECONNREFUSED":
      case "PROTOCOL_CONNECTION_LOST": {
        this.config.disconnected.call(this, error, "Auto-Reconnect Disabled") // TODO
      }
    }
  }
}

export class Connection {
  public connection: mysql.PoolConnection;
  public released = false;
  private lastQuery: string | undefined;
  constructor(connection?: mysql.PoolConnection) {
    if (typeof connection === "undefined") {
      throw new Error(`Cannot be called directly`)
    }
    this.connection = connection
  }
  public static async get() {
    const connection = await MySQLconnectionPool.beginTransaction()
    return new Connection(connection)
  }

  public async commit(releaseConnection = true) {
    this.checkIfReleased()

    if (releaseConnection === true) {
      await MySQLconnectionPool.commit(this.connection, true)
      this.released = true
    } else {
      await MySQLconnectionPool.commit(this.connection, false)
      await MySQLconnectionPool.beginTransaction(this.connection)
    }
  }
  public async rollback() {
    this.checkIfReleased()
    await MySQLconnectionPool.rollback(this.connection)
    this.released = true
  }

  public async execute(
    query: string,
    values: any = {},
    ignoreErrors?: boolean
  ): Promise<any> {
    this.checkIfReleased()
    this.lastQuery = query
    return await MySQLconnectionPool.query(
      query,
      values,
      this.connection,
      ignoreErrors
    )
  }
  public async query(query: string, values: any = {}, ignoreErrors?: boolean) {
    this.checkIfReleased()
    this.lastQuery = query
    return await MySQLconnectionPool.query(
      query,
      values,
      this.connection,
      ignoreErrors
    )
  }
  public async first(query: string, values: any = {}, ignoreErrors?: boolean) {
    this.checkIfReleased()
    this.lastQuery = query
    return await MySQLconnectionPool.first(
      query,
      values,
      this.connection,
      ignoreErrors
    )
  }

  private checkIfReleased() {
    if (this.released === true)
      throw new Error(
        `The connection already has been released.\nLast query: "${this.lastQuery}"`
      )
  }
}
(<any>global).MySQLconnection = Connection

export function formatQuery(query: string, values: any) {
  if (!values) return query
  if (Array.isArray(values)) {
    return query.replace(/\?/g, (txt: any, key: any) => {
      if (values.length > 0) {
        return mysql.escape(values.shift())
      }
      return txt
    })
  }
  return query.replace(/\:(\w+)/g, (txt: any, key: any) => {
    if (values.hasOwnProperty(key)) {
      return mysql.escape(values[key])
    }
    return txt
  })
}

let reconnectAttempts = 0
export async function MySQLConnect() {
  try {
    (<any>global).MySQLconnectionPool = new ConnectionPool(
      extend(
        {
          async disconnected() {
            log.fatal("Lost connection to MySQL Database")
            process.exit(0)
          }
        },
        Config.database
      )
    )
    await MySQLconnectionPool.connect()
    log.info("Connected to MySQL Database")
    reconnectAttempts = 0
  } catch (e) {
    reconnectAttempts += 1
    if (e.code === "ECONNREFUSED")
      log.error(
        `Unable to connect to MySQL Database [ECONNREFUSED] ${reconnectAttempts}/${Config.database.autoReconnectMaxAttempt}`
      )
    if (reconnectAttempts >= Config.database.autoReconnectMaxAttempt) {
      log.fatal(`Max reconnect attempts reached`)
      process.exit(0)
    }
    await promisify(setTimeout)(Config.database.autoReconnectDelay)
    await MySQLConnect()
  }
}
