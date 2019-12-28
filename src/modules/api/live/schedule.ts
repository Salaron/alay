import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import moment = require("moment")

const marathonDB = sqlite3.getMarathon()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const currentDayOfWeek = moment().utcOffset("+0900").day()

    const response: any = {
      event_list: [],
      live_list: [],
      limited_bonus_list: [],
      random_live_list: [
        {
          attribute_id: currentDayOfWeek % 3 + 1,
          start_date: moment().utcOffset("+0900").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
          end_date: moment().utcOffset("+0900").endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          attribute_id: (currentDayOfWeek + 1) % 3 + 1,
          start_date: moment().utcOffset("+0900").add(1, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
          end_date: moment().utcOffset("+0900").add(1, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss"),
        }
      ],
      free_live_list: [],
      training_live_list: []
    }

    if (Config.modules.live.unlockAll) {
      const specialLiveList = this.live.specialLiveList
      for (const live of specialLiveList) {
        response.live_list.push({
          live_difficulty_id: live,
          start_date: "2018-01-01 00:00:00",
          end_date: "2020-01-01 06:00:00",
          is_random: false
        })
      }
    }

    const eventList = await this.connection.query("SELECT * FROM events_list WHERE open_date <= :now AND close_date > :now", {
      now: Utils.toSpecificTimezone(9)
    })

    for (const event of eventList) {
      response.event_list.push({
        event_id: event.event_id,
        event_category_id: event.event_category_id,
        name: event.name,
        open_date: event.open_date,
        start_date: event.start_date,
        end_date: event.end_date,
        close_date: event.close_date,
        banner_asset_name: event.banner_asset_name,
        banner_se_asset_name: event.banner_se_asset_name,
        result_banner_asset_name: event.result_banner_asset_name,
        description: event.description,
        member_category: event.member_category
      })
    }

    const marathonEvent = await this.event.getEventStatus(this.event.TYPES.TOKEN)
    if (marathonEvent.active) {
      const marathonLives = (await marathonDB.all("SELECT live_difficulty_id FROM event_marathon_live_schedule_m WHERE event_id = :id", {
        id: marathonEvent.id
      })).map((live) => live.live_difficulty_id)
      for (const live of marathonLives) {
        response.live_list.push({
          live_difficulty_id: live,
          start_date: marathonEvent.open_date,
          end_date: marathonEvent.close_date,
          is_random: false
        })
      }
    }

    return {
      status: 200,
      result: response
    }
  }
}
