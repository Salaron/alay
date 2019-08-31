import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import moment from "moment"
import { Utils } from "../../../common/utils"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let museBanners = await this.connection.query(`
    SELECT * FROM (
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, secretbox_id as target_id, 1 as banner_type, 0 as master_is_active_event, member_category, NULL as webview_url, start_date, end_date FROM secretbox_list
      UNION
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, event_id as target_id, 0 as banner_type, 1 as master_is_active_event, member_category, NULL as webview_url, open_date as start_date, close_date as end_date FROM events_list
    	UNION
    	SELECT  asset_path, asset_path_se, target_id, banner_type, master_is_active_event, member_category, webview_url, start_date, end_date FROM banner_list
    ) as b WHERE asset_path IS NOT NULL AND asset_path_se IS NOT NULL AND start_date < :now AND end_date > :now ORDER BY member_category ASC, master_is_active_event DESC`, {
      now: Utils.toSpecificTimezone(9)
    })
    let aqoursBanners = await this.connection.query(`
    SELECT * FROM (
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, secretbox_id as target_id, 1 as banner_type, 0 as master_is_active_event, member_category, NULL as webview_url, start_date, end_date FROM secretbox_list
      UNION
      SELECT banner_asset_name as asset_path, banner_se_asset_name as asset_path_se, event_id as target_id, 0 as banner_type, 1 as master_is_active_event, member_category, NULL as webview_url, open_date as start_date, close_date as end_date FROM events_list
    	UNION
    	SELECT  asset_path, asset_path_se, target_id, banner_type, master_is_active_event, member_category, webview_url, start_date, end_date FROM banner_list
    ) as b WHERE asset_path IS NOT NULL AND asset_path_se IS NOT NULL AND start_date < :now AND end_date > :now ORDER BY member_category DESC, master_is_active_event DESC`, {
      now: Utils.toSpecificTimezone(9)
    })

    let museCategory = {
      member_category: 1,
      banner_list: <any>[]
    }
    let aqoursCategory = {
      member_category: 2,
      banner_list: <any>[]
    }

    for (let i = 0; i < museBanners.length; i++) {
      let banner = museBanners[i]
      banner.member_category = undefined
      banner.start_date = undefined
      banner.end_date = undefined
      banner.master_is_active_event = banner.master_is_active_event === 1 ? true : undefined
      banner.fixed_flag = false
      museCategory.banner_list.push(banner)
    }
    for (let i = 0; i < aqoursBanners.length; i++) {
      let banner = aqoursBanners[i]
      banner.member_category = undefined
      banner.start_date = undefined
      banner.end_date = undefined
      banner.master_is_active_event = banner.master_is_active_event === 1 ? true : undefined
      banner.fixed_flag = false
      aqoursCategory.banner_list.push(banner)
    }


    let response = {
      time_limit: moment(new Date()).utcOffset("+0900").add(1, "hour").format("YYYY-MM-DD HH:mm:SS"),
      member_category_list: [museCategory, aqoursCategory],
      server_timestamp: Utils.timeStamp()
    }

    return {
      status: 200,
      result: response
    }
  }
}