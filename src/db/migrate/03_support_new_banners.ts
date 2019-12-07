import { Connection } from "../../core/database/mariadb"
import { Logger } from "../../core/logger"

const log = new Logger("rLive")

export async function migrate(connection: Connection) {
  log.info("In 6.9 was added banners with id")
  const banners = (await connection.query("SELECT * FROM banner_list")).map(banner => {
    return `INSERT INTO banner_list (banner_type, target_id, asset_path, asset_path_se, member_category, webview_url, master_is_active_event, start_date, end_date) VALUES (${banner.banner_type}, ${banner.target_id}, ${banner.asset_path}, ${banner.asset_path_se}, ${banner.member_category}, ${banner.webview_url}, ${banner.master_is_active_event}, ${banner.start_date}, ${banner.end_date})`
  })
  console.log(banners.join(";\n"))
  await connection.query(`DROP TABLE banner_list;`)
}
