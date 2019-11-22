import { existsSync } from "fs"
import * as sqliteDB from "sqlite3"
import { formatQuery } from "./query"

// used internally
// make sqlite3 promise-like
class Sqlite3Wrapper {
  public database: sqliteDB.Database
  public closed = false
  private databaseName: string
  private lastQuery: string | undefined
  constructor(fileName: string, mode: "ro" | "rw" | number) {
    if (mode === "ro") mode = sqliteDB.OPEN_READONLY
    else mode = sqliteDB.OPEN_READWRITE
    this.database = new sqliteDB.Database(fileName, mode)
    this.databaseName = fileName
  }

  public async close(): Promise<void> {
    this.checkIfClosed()
    return new Promise((res, rej) => {
      this.database.close((err) => {
        if (err) return rej(err)
        this.closed = true
        res()
      })
    })
  }
  public async exec(query: string, values?: any): Promise<void> {
    this.checkIfClosed()
    const preparedQuery = this.lastQuery = formatQuery(query, values)
    return new Promise((res, rej) => {
      this.database.exec(preparedQuery, (err) => {
        if (err) return rej(err)
        res()
      })
    })
  }
  public async run(query: string, values?: any): Promise<void> {
    this.checkIfClosed()
    const preparedQuery = formatQuery(query, values)
    this.lastQuery = preparedQuery
    return new Promise((res, rej) => {
      this.database.run(preparedQuery, (err) => {
        if (err) return rej(err)
        res()
      })
    })
  }
  public async get(query: string, values?: any): Promise<any> {
    this.checkIfClosed()
    const preparedQuery = formatQuery(query, values)
    this.lastQuery = preparedQuery
    return new Promise((res, rej) => {
      this.database.get(preparedQuery, (err, row) => {
        if (err) return rej(err)
        res(row)
      })
    })
  }
  public async all(query: string, values?: any): Promise<any[]> {
    this.checkIfClosed()
    const preparedQuery = formatQuery(query, values)
    this.lastQuery = preparedQuery
    return new Promise((res, rej) => {
      this.database.all(preparedQuery, (err, rows) => {
        if (err) return rej(err)
        res(rows)
      })
    })
  }

  public checkIfClosed() {
    if (this.closed) throw new Error(`The database "${this.databaseName}" is closed.\nLast query: "${this.lastQuery}"`)
  }
}

export class Sqlite3 {
  private unit: Sqlite3Wrapper
  private live: Sqlite3Wrapper
  private duty: Sqlite3Wrapper
  private exchange: Sqlite3Wrapper
  private festival: Sqlite3Wrapper
  private item: Sqlite3Wrapper
  private notes: Sqlite3Wrapper
  private marathon: Sqlite3Wrapper
  private secretbox: Sqlite3Wrapper
  private other: Sqlite3Wrapper
  private event: Sqlite3Wrapper
  private achievement: Sqlite3Wrapper
  private download: Sqlite3Wrapper
  private banner: Sqlite3Wrapper
  constructor() {
    this.checkAllDatabases([
      "unit.db_",
      "live.db_",
      "team_duty.db_",
      "exchange.db_",
      "festival.db_",
      "item.db_",
      "marathon.db_",
      "secretbox.db_",
      "other.db_",
      "event_common.db_",
      "achievement.db_",
      "sv_live_notes.db_",
      "sv_download.db_",
      "sv_banner.db_"
    ])
  }
  public getUnit() {
    if (!this.unit || this.unit.closed) return this.unit = new Sqlite3Wrapper(rootDir + "data/db/unit.db_", "ro")
    else return this.unit
  }
  public getLive() {
    if (!this.live || this.live.closed) return this.live = new Sqlite3Wrapper(rootDir + "data/db/live.db_", "ro")
    else return this.live
  }
  public getDuty() {
    if (!this.duty || this.duty.closed) return this.duty = new Sqlite3Wrapper(rootDir + "data/db/team_duty.db_", "ro")
    else return this.duty
  }
  public getFestival() {
    if (!this.festival || this.festival.closed) return this.festival = new Sqlite3Wrapper(rootDir + "data/db/festival.db_", "ro")
    else return this.festival
  }
  public getMarathon() {
    if (!this.marathon || this.marathon.closed) return this.marathon = new Sqlite3Wrapper(rootDir + "data/db/marathon.db_", "ro")
    else return this.marathon
  }
  public getNotes() {
    if (!this.notes || this.notes.closed) return this.notes = new Sqlite3Wrapper(rootDir + "data/db/sv_live_notes.db_", "ro")
    else return this.notes
  }
  public getExchange() {
    if (!this.exchange || this.exchange.closed) return this.exchange = new Sqlite3Wrapper(rootDir + "data/db/exchange.db_", "ro")
    else return this.exchange
  }
  public getItem() {
    if (!this.item || this.item.closed) return this.item = new Sqlite3Wrapper(rootDir + "data/db/item.db_", "ro")
    else return this.item
  }
  public getSecretbox() {
    if (!this.secretbox || this.secretbox.closed) return this.secretbox = new Sqlite3Wrapper(rootDir + "data/db/secretbox.db_", "ro")
    else return this.secretbox
  }
  public getOther() {
    if (!this.other || this.other.closed) return this.other = new Sqlite3Wrapper(rootDir + "data/db/other.db_", "ro")
    else return this.other
  }
  public getEvent() {
    if (!this.event || this.event.closed) return this.event = new Sqlite3Wrapper(rootDir + "data/db/event_common.db_", "ro")
    else return this.event
  }
  public getAchievement() {
    if (!this.achievement || this.achievement.closed) return this.achievement = new Sqlite3Wrapper(rootDir + "data/db/achievement.db_", "ro")
    else return this.achievement
  }
  public getDownload() {
    if (!this.download || this.download.closed) return this.download = new Sqlite3Wrapper(rootDir + "data/db/sv_download.db_", "rw")
    else return this.download
  }
  public getBanner() {
    if (!this.banner || this.banner.closed) return this.banner = new Sqlite3Wrapper(rootDir + "data/db/sv_banner.db_", "rw")
    else return this.banner
  }

  private checkAllDatabases(dbNames: string[]) {
    dbNames.forEach(dbName => {
      if (!existsSync(`${rootDir}/data/db/${dbName}`)) {
        throw new Error(`Required file 'data/db/${dbName}' is missing`)
      }
    })
  }
}
