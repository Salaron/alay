import * as mysql from "mysql"
import Log from "./log"
import extend from "extend"
import { promisify } from "util"
import sqlite3 from "./sqlite3"
import { existsSync } from "fs"

const log = new Log.Create(logLevel, "Database")
interface PoolConfig extends mysql.PoolConfig {
  autoReconnect: boolean
  autoReconnectMaxAttempt: number
  autoReconnectDelay: number
  disconnected: Function
}

export class database {
  public config: PoolConfig
  public pool: mysql.Pool
  public reconnectAttempts: number
  public freeConnections: mysql.PoolConnection[]
  public createdConnections: mysql.PoolConnection[]
  public acquiringConnections: mysql.PoolConnection[]
  private debugInterval: any
  constructor(config: any) {
    this.config = extend({
      autoReconnect: true,
      autoReconnectDelay: 1000,
      autoReconnectMaxAttempt: 10,
      disconnected: () => { },
      dateStrings: true,
      queryFormat: formatQuery,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      connectionLimit: 30
    }, config)
    this.reconnectAttempts = 0
  }

  public async connect() {
    return new Promise(async (res, rej) => {
      try {
        this.pool = mysql.createPool(this.config)
        this.pool.on("error", async (err) => {
          log.error(err)
          await this.handleDisconnect(err)
        })

        let connection = await Connection.get()
        await Promise.all([
          connection.query(`SET names UTF8`),
          connection.query(`SET SESSION group_concat_max_len = 4294967295`),
          connection.query(`SET @@sql_mode=(SELECT REPLACE(@@sql_mode,"ONLY_FULL_GROUP_BY",""))`)
        ])
        await connection.commit()

        this.reconnectAttempts = 0
        this.freeConnections = (<any>this.pool)._freeConnections
        this.createdConnections = (<any>this.pool)._allConnections
        this.acquiringConnections = (<any>this.pool)._acquiringConnections
        res()
      } catch (err) {
        rej(err)
      }
    })
  }

  public async beginTransaction(connection?: mysql.PoolConnection): Promise<mysql.PoolConnection> {
    return new Promise(async (res, rej) => {
      try {
        if (connection === undefined) connection = await this.getConnection()
      } catch (err) {
        return rej(err)
      }
      connection.beginTransaction(async (err) => {
        if (err) {
          await this.handleDisconnect(err)
          return rej(err)
        }
        res(connection)
      })
    })
  }
  public async commit(connection: mysql.PoolConnection, release = true): Promise<void> {
    return new Promise(async (res, rej) => {
      connection.commit(async (err) => {
        if (err) {
          if (this.freeConnections.indexOf(connection) === -1) connection.release()
          await this.handleDisconnect(err)
          return rej(err)
        }
        if (release == true) connection.release()
        res()
      })
    })
  }
  public async rollback(connection: mysql.PoolConnection, release = true): Promise<void> {
    return new Promise(async (res, rej) => {
      connection.rollback(async (err) => {
        if (err) {
          if (this.freeConnections.indexOf(connection) === -1) connection.release()
          await this.handleDisconnect(err)
          return rej(err)
        }
        if (release == true) connection.release()
        res()
      })
    })
  }

  public async query(query: string, values: any = {}, connection?: mysql.PoolConnection): Promise<any[]> {
    return new Promise(async (res, rej) => {
      let transaction = false
      try {
        if (connection == undefined) connection = await this.getConnection()
        else transaction = true
      } catch (err) {
        rej(err)
      }
      (<mysql.PoolConnection>connection).query(query, values, async (err, result) => {
        if (!transaction) (<mysql.PoolConnection>connection).release()
        if (err) {
          log.error(`The error has occurred while performing a query:\n"${query}" with this values: ${JSON.stringify(values)}`)
          await this.handleDisconnect(err)
          return rej(err)
        }
        res(result)
      })
    })
  }
  public async first(query: string, values: any = {}, connection?: mysql.PoolConnection): Promise<any> {
    return new Promise(async (res, rej) => {
      let transaction = false
      if (connection == undefined) connection = await this.getConnection()
      else transaction = true

      if (query.slice(-1) === ";") query = query.slice(0, -1) // remove ";" -- the end of query
      // select only 1 element 
      connection.query(query + " LIMIT 1;", values, async (err, result) => {
        if (!transaction) (<mysql.PoolConnection>connection).release()
        if (err) {
          log.error(`The error has occurred while performing a query:\n"${query}" with this values: ${JSON.stringify(values)}`)
          await this.handleDisconnect(err)
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
    if (typeof this.debugInterval === "undefined" && log.level >= Log.LEVEL.DEBUG) {
      log.debug(`Pool Connection Debug Info Enabled`)
      this.debugInterval = setInterval(() => {
        log.debug(`Pool connection limit: ${MySQLdatabase.config.connectionLimit}`)
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
      this.pool.getConnection((err, connection) => {
        if (err) return rej(err)
        res(connection)
      })
    })
  }

  private async handleDisconnect(error: mysql.MysqlError, hideMessage: boolean = false): Promise<void> {
    if (!hideMessage) log.error(error.message + " [" + error.code + "]")
    switch (error.code) {
      case "ECONNREFUSED":
      case "PROTOCOL_CONNECTION_LOST": {
        if (this.config.autoReconnect != true) this.config.disconnected.call(this, error, "Auto-Reconnect Disabled")
        if (this.config.autoReconnectMaxAttempt < this.reconnectAttempts) this.config.disconnected.call(this, error, "Max Reconnect Attempts")
        this.reconnectAttempts += 1
        try {
          await promisify(this.connect)()
          log.info("Reconnected")
        } catch (err) {
          let t = this
          setTimeout(function () {
            t.handleDisconnect(err, false)
          }, this.config.autoReconnectDelay)
        }
        break
      }
    }
  }
}

export class Connection {
  public connection: mysql.PoolConnection
  public released: boolean = false
  private lastQuery: string | undefined
  constructor(connection?: mysql.PoolConnection) {
    if (typeof connection === "undefined") {
      throw new Error(`Cannot be called directly`)
    }
    this.connection = connection
  }
  static async get() {
    let connection = await MySQLdatabase.beginTransaction()
    return new Connection(connection)
  }

  async commit(releaseConnection = true) {
    this.checkIfReleased()

    if (releaseConnection === true) {
      await MySQLdatabase.commit(this.connection, true)
      this.released = true
    } else {
      await MySQLdatabase.commit(this.connection, false)
      await MySQLdatabase.beginTransaction(this.connection)
    }
  }
  async rollback() {
    this.checkIfReleased()
    await MySQLdatabase.rollback(this.connection)
    this.released = true
  }

  async query(query: string, values: any = {}) {
    this.checkIfReleased()
    this.lastQuery = query
    return await MySQLdatabase.query(query, values, this.connection)
  }
  async first(query: string, values: any = {}) {
    this.checkIfReleased()
    this.lastQuery = query
    return await MySQLdatabase.first(query, values, this.connection)
  }

  private checkIfReleased() {
    if (this.released === true) throw new Error(`The connection already has been released.\nLast query: "${this.lastQuery}"`)
  }
}

export class Sqlite3 {
  private unit: sqlite3
  private live: sqlite3
  private duty: sqlite3
  private exchange: sqlite3
  private festival: sqlite3
  private item: sqlite3
  private notes: sqlite3
  private marathon: sqlite3
  private secretbox: sqlite3
  private other: sqlite3
  constructor() {
    // check if all databases exists
    if (!existsSync(rootDir + "data/db/unit.db_")) {
      throw new Error("Required file 'data/db/unit.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/live.db_")) {
      throw new Error("Required file 'data/db/live.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/team_duty.db_")) {
      throw new Error("Required file 'data/db/team_duty.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/exchange.db_")) {
      throw new Error("Required file 'data/db/exchange.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/festival.db_")) {
      throw new Error("Required file 'data/db/festival.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/item.db_")) {
      throw new Error("Required file 'data/db/item.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/live_notes.db_")) {
      throw new Error("Required file 'data/db/live_notes.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/marathon.db_")) {
      throw new Error("Required file 'data/db/marathon.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/secretbox.db_")) {
      throw new Error("Required file 'data/db/secretbox.db_' is missing")
    }
    if (!existsSync(rootDir + "data/db/other.db_")) {
      throw new Error("Required file 'data/db/other.db_' is missing")
    }
  }
  public getUnit() {
    if (!this.unit || this.unit.closed) return this.unit = new sqlite3(rootDir + "data/db/unit.db_", "ro")
    else return this.unit
  }
  public getLive() {
    if (!this.live || this.live.closed) return this.live = new sqlite3(rootDir + "data/db/live.db_", "ro")
    else return this.live
  }
  public getDuty() {
    if (!this.duty || this.duty.closed) return this.duty = new sqlite3(rootDir + "data/db/team_duty.db_", "ro")
    else return this.duty
  }
  public getFestival() {
    if (!this.festival || this.festival.closed) return this.festival = new sqlite3(rootDir + "data/db/festival.db_", "ro")
    else return this.festival
  }
  public getMarathon() {
    if (!this.marathon || this.marathon.closed) return this.marathon = new sqlite3(rootDir + "data/db/exchange.db_", "ro")
    else return this.marathon
  }
  public getNotes() {
    if (!this.notes || this.notes.closed) return this.notes = new sqlite3(rootDir + "data/db/live_notes.db_", "ro")
    else return this.notes
  }
  public getExchange() {
    if (!this.exchange || this.exchange.closed) return this.exchange = new sqlite3(rootDir + "data/db/exchange.db_", "ro")
    else return this.exchange
  }
  public getItem() {
    if (!this.item || this.item.closed) return this.item = new sqlite3(rootDir + "data/db/item.db_", "ro")
    else return this.item
  }
  public getSecretbox() {
    if (!this.secretbox || this.secretbox.closed) return this.secretbox = new sqlite3(rootDir + "data/db/secretbox.db_", "ro")
    else return this.secretbox
  }
  public getOther() {
    if (!this.other || this.other.closed) return this.other = new sqlite3(rootDir + "data/db/other.db_", "ro")
    else return this.other
  }
}

(<any>global).MySQLconnection = Connection

export function formatQuery(query: string, values: any) {
  if (!values) return query
  if (Array.isArray(values)) {
    return query.replace(/\?/g, function (txt: any, key: any) {
      if (values.length > 0) {
        return mysql.escape(values.shift())
      }
      return txt
    })
  }
  return query.replace(/\:(\w+)/g, function (txt: any, key: any) {
    if (values.hasOwnProperty(key)) {
      return mysql.escape(values[key])
    }
    return txt
  })
}
