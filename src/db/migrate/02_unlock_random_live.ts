import { Connection } from "../../core/database/mariadb"
import { Log } from "../../core/log"

const log = new Log("rLive")

export async function migrate(connection: Connection) {
  log.info("Random Live feature is available!")
  await connection.query(`
    ALTER TABLE users CHANGE COLUMN unlock_random_live_muse unlock_random_live_muse TINYINT(1) UNSIGNED NOT NULL DEFAULT '1';
    ALTER TABLE users CHANGE COLUMN unlock_random_live_aqours unlock_random_live_aqours TINYINT(1) UNSIGNED NOT NULL DEFAULT '1';
    ALTER TABLE users CHANGE COLUMN sns_coin sns_coin INT(10) UNSIGNED NOT NULL DEFAULT '0';

    CREATE TABLE user_live_random (
      user_id int(10) UNSIGNED NOT NULL,
      attribute tinyint(1) NOT NULL,
      difficulty tinyint(1) NOT NULL,
      member_category tinyint(4) NOT NULL,
      token varchar(64) NOT NULL,
      live_difficulty_id mediumint(9) NOT NULL,
      in_progress tinyint(4) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    ALTER TABLE \`user_live_random\`
      ADD PRIMARY KEY (\`user_id\`,\`attribute\`,\`difficulty\`,\`member_category\`);
    ALTER TABLE \`user_live_random\`
      ADD CONSTRAINT \`FK_user_live_random_uid\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE;
  `)
}
