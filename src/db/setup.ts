import "../global"
import "../core/config"
Config.database.multipleStatements = true
import { readdirSync } from "fs"
import { Utils } from "../common/utils"
import { Connect as ConnectToMariaDB, Connection } from "../core/database/mysql"
import { Logger } from "../core/logger"
import { extname } from "path"

let dbConnection: Connection
const log = new Logger("Migrate");

(async () => {
  await ConnectToMariaDB()
  dbConnection = await Connection.beginTransaction()

  const scripts = readdirSync("migrate")
    .filter(name => {
      return extname(name) === ".js"
    })
    .map(name => {
      return name.split(".").slice(0, -1).join(".")
    })
    .sort((s1, s2) => {
      return Utils.versionCompare(s1.split("_")[0], s2.split("_")[0])
    })

  let version = 0
  try {
    const result = await dbConnection.query("SELECT * FROM users LIMIT 1;")
    if (result.length > 0) version = 2
  } catch { } // tslint:disable-line: no-empty

  try {
    const result = await dbConnection.query("SELECT * FROM meta WHERE `key` = 'version';")
    if (result.length > 0) {
      version = result[0].value
    } else {
      log.warn("'meta' table doesn't contains 'version'")
      version = parseInt(scripts[scripts.length - 1].split("_")[0], 10)
      await dbConnection.query("INSERT INTO meta (`key`, `value`) VALUES ('version', ?)", [version])
    }
  } catch {
    log.warn("'meta' table not exists, we'll create it")
    await dbConnection.query(`
      CREATE TABLE meta (
        \`key\` VARCHAR(50) NOT NULL,
        \`value\` TEXT NOT NULL
      ) ENGINE=InnoDB;
    `)
    await dbConnection.query("INSERT INTO meta (`key`, value) VALUES ('version', ?)", [version])
  }

  let migrated = false
  for (const scriptName of scripts) {
    const script = await import(`./migrate/${scriptName}`)
    const scriptVersion = scriptName.split("_")[0]
    if (version >= parseInt(scriptVersion)) continue
    version = parseInt(scriptVersion)
    migrated = true

    await script.migrate(dbConnection)
    log.info(`Migration '${scriptName}' done`)
  }
  await dbConnection.query("UPDATE meta SET value = ? WHERE `key` = 'version'", [version])
  await dbConnection.commit()

  if (migrated) {
    log.info("End of migration")
  } else {
    log.info("Up to date!")
  }
  process.exit()
})().catch(async err => {
  if (dbConnection) {
    await dbConnection.rollback()
  }
  log.fatal(err)
  process.exit(0)
}).finally(() => {
  if (dbConnection) dbConnection.release()
})
