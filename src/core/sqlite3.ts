import * as sqliteDB from "sqlite3"
import { formatQuery } from "./database"

export default class Sqlite3 {
  public database: sqliteDB.Database
  public closed: boolean = false
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
    this.lastQuery = formatQuery(query, values)
    return new Promise((res, rej) => {
      this.database.exec(formatQuery(query, values), (err) => {
        if (err) return rej(err)
        res()
      })
    })
  }
  public async run(query: string, values?: any): Promise<void> {
    this.checkIfClosed()
    this.lastQuery = formatQuery(query, values)
    return new Promise((res, rej) => {
      this.database.run(formatQuery(query, values), (err) => {
        if (err) return rej(err)
        res()
      })
    })
  }
  public async get(query: string, values?: any): Promise<any> {
    this.checkIfClosed()
    this.lastQuery = formatQuery(query, values)
    return new Promise((res, rej) => {
      this.database.get(formatQuery(query, values), (err, row) => {
        if (err) return rej(err)
        res(row)
      })
    })
  }
  public async all(query: string, values?: any): Promise<any> {
    this.checkIfClosed()
    this.lastQuery = formatQuery(query, values)
    return new Promise((res, rej) => {
      this.database.all(formatQuery(query, values), (err, rows) => {
        if (err) return rej(err)
        res(rows)
      })
    })
  }

  public checkIfClosed() {
    if (this.closed) throw new Error(`The database "${this.databaseName}" is closed.\nLast query: "${this.lastQuery}"`)
  }
}