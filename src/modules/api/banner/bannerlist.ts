import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import moment from "moment"
import { Utils } from "../../../common/utils"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const museBanners = await this.connection.query(`
    SELECT * FROM (
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, secretbox_id as target_id, 1 as banner_type, 0 as master_is_active_event, member_category, NULL as webview_url, start_date, end_date FROM secretbox_list
      UNION
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, event_id as target_id, 0 as banner_type, 1 as master_is_active_event, member_category, NULL as webview_url, open_date as start_date, close_date as end_date FROM events_list
    	UNION
    	SELECT  asset_path, asset_path_se, target_id, banner_type, master_is_active_event, member_category, webview_url, start_date, end_date FROM banner_list
    ) as b WHERE asset_path IS NOT NULL AND asset_path_se IS NOT NULL AND start_date < :now AND end_date > :now ORDER BY member_category ASC, master_is_active_event DESC`, {
      now: Utils.toSpecificTimezone(9)
    })
    const aqoursBanners = await this.connection.query(`
    SELECT * FROM (
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, secretbox_id as target_id, 1 as banner_type, 0 as master_is_active_event, member_category, NULL as webview_url, start_date, end_date FROM secretbox_list
      UNION
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, event_id as target_id, 0 as banner_type, 1 as master_is_active_event, member_category, NULL as webview_url, open_date as start_date, close_date as end_date FROM events_list
    	UNION
    	SELECT asset_path, asset_path_se, target_id, banner_type, master_is_active_event, member_category, webview_url, start_date, end_date FROM banner_list
    ) as b WHERE asset_path IS NOT NULL AND asset_path_se IS NOT NULL AND start_date < :now AND end_date > :now ORDER BY member_category DESC, master_is_active_event DESC`, {
      now: Utils.toSpecificTimezone(9)
    })

    const museCategory = {
      member_category: 1,
      banner_list: museBanners.map(banner => {
        return {
          banner_type: banner.banner_type,
          target_id: banner.target_id,
          asset_path: banner.asset_path,
          asset_path_se: banner.asset_path_se,
          fixed_flag: false,
          back_side: false,
          master_is_active_event: banner.master_is_active_event === 1 ? true : undefined,
          banner_id: 1,
          start_date: banner.start_date,
          end_date: banner.end_date || "2037-12-31 23:59:59"
        }
      })
    }
    const aqoursCategory = {
      member_category: 2,
      banner_list: aqoursBanners.map(banner => {
        return {
          banner_type: banner.banner_type,
          target_id: banner.target_id,
          asset_path: banner.asset_path,
          asset_path_se: banner.asset_path_se,
          fixed_flag: false,
          back_side: false,
          master_is_active_event: banner.master_is_active_event === 1 ? true : undefined,
          banner_id: 1,
          start_date: banner.start_date,
          end_date: banner.end_date || "2037-12-31 23:59:59"
        }
      })
    }

    const response = {
      time_limit: moment(new Date()).utcOffset("+0900").add(1, "hour").format("YYYY-MM-DD HH:mm:ss"),
      member_category_list: [museCategory, aqoursCategory]
    }

    return {
      status: 200,
      result: response
    }
  }
}
