import { existsSync } from "fs"
import * as sqliteDB from "sqlite3"
import { formatQuery } from "./query"
import { Utils } from "../../common/utils"

// make sqlite3 promise-like
class Sqlite3Wrapper {
  public db: sqliteDB.Database
  public closed = false

  private fileName: string
  private lastQuery: string | undefined
  constructor(fileName: string, mode: number) {
    this.db = new sqliteDB.Database(fileName, mode)
    this.fileName = fileName
  }

  public async close(): Promise<void> {
    return new Promise((res, rej) => {
      this.db.close((err) => {
        if (err) return rej(err)
        this.closed = true
        res()
      })
    })
  }

  public async exec(query: string, values?: any): Promise<void> {
    const preparedQuery = this.lastQuery = formatQuery(query, values)
    return new Promise((res, rej) => {
      this.db.exec(preparedQuery, (err) => {
        if (err) return rej(err)
        res()
      })
    })
  }

  public async run(query: string, values?: any): Promise<void> {
    const preparedQuery = formatQuery(query, values)
    this.lastQuery = preparedQuery
    return new Promise((res, rej) => {
      this.db.run(preparedQuery, (err) => {
        if (err) return rej(err)
        res()
      })
    })
  }

  public async get(query: string, values?: any): Promise<any> {
    const preparedQuery = formatQuery(query, values)
    this.lastQuery = preparedQuery
    return new Promise((res, rej) => {
      this.db.get(preparedQuery, (err, row) => {
        if (err) return rej(err)
        res(row)
      })
    })
  }

  public async all(query: string, values?: any): Promise<any[]> {
    const formatedQuery = formatQuery(query, values)
    this.lastQuery = formatedQuery
    return new Promise((res, rej) => {
      this.db.all(formatedQuery, (err, rows) => {
        if (err) return rej(err)
        res(rows)
      })
    })
  }

  public checkIfClosed() {
    if (this.closed) throw new Error(`The database "${this.fileName}" is closed.\nLast query: "${this.lastQuery}"`)
  }
}

export class Sqlite3 {
  private dbNames: string[] = [
    // client-side
    "event_common.db_",
    "exchange.db_",
    "festival.db_",
    "item.db_",
    "live.db_",
    "marathon.db_",
    "other.db_",
    "secretbox.db_",
    "team_duty.db_",
    "unit.db_",
    // server-side
    "sv_banner.db_",
    "sv_custom_live.db_",
    "sv_download.db_",
    "sv_live_notes.db_"
  ]
  private eventCommonDB: Sqlite3Wrapper
  private exchangeDB: Sqlite3Wrapper
  private festivalDB: Sqlite3Wrapper
  private itemDB: Sqlite3Wrapper
  private liveDB: Sqlite3Wrapper
  private marathonDB: Sqlite3Wrapper
  private otherDB: Sqlite3Wrapper
  private secretboxDB: Sqlite3Wrapper
  private teamDutyDB: Sqlite3Wrapper
  private unitDB: Sqlite3Wrapper

  private bannerSVDB: Sqlite3Wrapper
  private customLiveSVDB: Sqlite3Wrapper
  private downloadSVDB: Sqlite3Wrapper
  private liveNotesSVDB: Sqlite3Wrapper
  constructor() {
    this.checkDatabases()
    this.decryptReleaseInfo()
    this.initDatabases()
  }

  public getEventCommonDB() {
    return this.eventCommonDB
  }
  public getExchangeDB() {
    return this.exchangeDB
  }
  public getFestivalDB() {
    return this.festivalDB
  }
  public getItemDB() {
    return this.itemDB
  }
  public getLiveDB() {
    return this.liveDB
  }
  public getMarathonDB() {
    return this.marathonDB
  }
  public getOtherDB() {
    return this.otherDB
  }
  public getSecretboxDB() {
    return this.secretboxDB
  }
  public getTeamDutyDB() {
    return this.teamDutyDB
  }
  public getUnitDB() {
    return this.unitDB
  }

  // server-side
  public getBannerSVDB() {
    return this.bannerSVDB
  }
  public getCustomLiveSVDB() {
    return this.customLiveSVDB
  }
  public getDownloadSVDB() {
    return this.downloadSVDB
  }
  public getLiveNotesSVDB() {
    return this.liveNotesSVDB
  }

  private async decryptReleaseInfo() {
    let keys: { [id: number]: string } = {}
    let missingKeys: number[] = []
    Config.server.release_info.map((k) => {
      keys[k.id] = k.key
    })

    await this.dbNames.forEachAsync(async (dbName) => {
      const database = new Sqlite3Wrapper(dbName, sqliteDB.OPEN_READWRITE)

      const tables = await database.all("SELECT * FROM sqlite_master WHERE type='table'")

      await tables.forEachAsync(async (table) => {
        if (!table.sql.includes("release_tag")) return

        // get encrypted rows
        const rows = await database.all(`SELECT _rowid_ as __rowid, * FROM ${table.name} WHERE release_tag IS NOT NULL AND _encryption_release_id IS NOT NULL`)
        await rows.forEachAsync(async (row) => {
          const keyId = row._encryption_release_id
          const ciphertext = row.release_tag
          if (!keys[keyId]) {
            if (!missingKeys.includes(keyId)) missingKeys.push(keyId)
            return
          }

          const jsonData = JSON.parse(Utils.AESDecrypt(keys[keyId], ciphertext))
          let setValues = []
          for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
              setValues.push(`${key} = ${jsonData[key]}`)
            }
          }

          await database.exec(`UPDATE ${table.name} SET ${setValues.join(",")} WHERE _rowid_ = ${row["__rowid"]}`)
          await database.exec(`UPDATE ${table.name} SET release_tag = NULL, _encryption_release_id = NULL WHERE _rowid_ = ${row["__rowid"]}`)
        })
      })
      await database.close()
    })
  }

  private checkDatabases(): void {
    this.dbNames.forEach(dbName => {
      if (!existsSync(`./data/db/${dbName}`)) {
        throw new Error(`Required file 'data/db/${dbName}' is missing`)
      }
    })
  }

  private initDatabases(): void {
    this.eventCommonDB = new Sqlite3Wrapper("event_common.db_", sqliteDB.OPEN_READONLY)
    this.exchangeDB = new Sqlite3Wrapper("exchange.db_", sqliteDB.OPEN_READONLY)
    this.festivalDB = new Sqlite3Wrapper("festival.db_", sqliteDB.OPEN_READONLY)
    this.itemDB = new Sqlite3Wrapper("item.db_", sqliteDB.OPEN_READONLY)
    this.liveDB = new Sqlite3Wrapper("live.db_", sqliteDB.OPEN_READONLY)
    this.marathonDB = new Sqlite3Wrapper("marathon.db_", sqliteDB.OPEN_READONLY)
    this.otherDB = new Sqlite3Wrapper("other.db_", sqliteDB.OPEN_READONLY)
    this.secretboxDB = new Sqlite3Wrapper("secretbox.db_", sqliteDB.OPEN_READONLY)
    this.teamDutyDB = new Sqlite3Wrapper("team_duty.db_", sqliteDB.OPEN_READONLY)
    this.unitDB = new Sqlite3Wrapper("unit.db_", sqliteDB.OPEN_READONLY)

    this.bannerSVDB = new Sqlite3Wrapper("sv_banner.db_", sqliteDB.OPEN_READONLY)
    this.customLiveSVDB = new Sqlite3Wrapper("sv_custom_live.db_", sqliteDB.OPEN_READONLY)
    this.downloadSVDB = new Sqlite3Wrapper("sv_download.db_", sqliteDB.OPEN_READONLY)
    this.liveNotesSVDB = new Sqlite3Wrapper("sv_live_notes.db_", sqliteDB.OPEN_READONLY)
  }
}
