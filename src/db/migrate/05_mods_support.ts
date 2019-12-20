import { Connection } from "../../core/database/mysql"
import { Logger } from "../../core/logger"

const log = new Logger("rLive")

export async function migrate(connection: Connection) {
  log.info("Now used shows in the profile")
  await connection.query(`
  ALTER TABLE user_live_progress
    ADD COLUMN mods INT NOT NULL DEFAULT '0' AFTER lp_factor;
  UPDATE user_live_log
    SET mods = 0;
  ALTER TABLE user_live_log
    CHANGE COLUMN mods mods INT NOT NULL DEFAULT 0 AFTER live_setting_ids;
  `)
}
