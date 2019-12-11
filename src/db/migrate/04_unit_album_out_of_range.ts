import { Connection } from "../../core/database/mariadb"
import { Logger } from "../../core/logger"

const log = new Logger("rLive")

export async function migrate(connection: Connection) {
  log.info("There was a type error in user_unit_album...")
  await connection.query(`ALTER TABLE user_unit_album	CHANGE COLUMN highest_love_per_unit highest_love_per_unit INT UNSIGNED NOT NULL DEFAULT 0 AFTER all_max_flag`)
}
