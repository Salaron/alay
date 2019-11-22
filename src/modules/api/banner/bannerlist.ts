import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import moment from "moment"
import { Utils } from "../../../common/utils"

const bannerDB = sqlite3.getBanner()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: {
        time_limit: moment(new Date()).utcOffset("+0900").add(1, "h").format("YYYY-MM-DD HH:mm:ss"),
        member_category_list: [await this.getBannerList(1), await this.getBannerList(2)]
      }
    }
  }

  private async getBannerList(memberCategory: memberCategory) {
    const list = (await bannerDB.all(`SELECT * FROM banner WHERE date(start_date) <= date(:now) AND date(end_date) > date(:now) ORDER BY member_category ${memberCategory === 1 ? "ASC" : "DESC"}`, {
      now: Utils.toSpecificTimezone(9)
    })).map(banner => {
      return {
        banner_type: banner.type,
        target_id: banner.target,
        asset_path: banner.asset_path,
        asset_path_se: banner.asset_path_se,
        fixed_flag: banner.fixed_flag ? true : false,
        back_side: banner.back_side ? true : false,
        banner_id: banner.id,
        start_date: banner.start_date,
        end_date: banner.end_date,
        webview_url: banner.webview_url
      }
    })

    return {
      member_category: memberCategory,
      banner_list: list
    }
  }
}
