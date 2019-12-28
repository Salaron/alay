import { Connection } from "../../core/database/mysql"
import { Logger } from "../../core/logger"

const log = new Logger("rLive")

export async function migrate(connection: Connection) {
  log.info("MedFes event!")
  await connection.query(`
  DROP TABLE event_festival_live_progress;
  ALTER TABLE user_live_progress
    ADD COLUMN event_id INT NULL DEFAULT NULL AFTER mods;
  `)
}
