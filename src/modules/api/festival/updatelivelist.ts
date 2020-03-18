import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, FESTIVAL_SETLIST, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const liveDB = sqlite3.getLiveDB()
const festDB = sqlite3.getFestivalDB()

export const enum costType {
  GAME_COIN = 3,
  SNS_COIN = 4,
}
function convertCost(cost: costType) {
  switch (cost) {
    case costType.GAME_COIN: return "game_coin"
    case costType.SNS_COIN: return "sns_coin"
    default: throw new Error(`Cost type "${cost}" is not implemented`)
  }
}
export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      mgd: TYPE.INT
    }
  }
  public paramCheck() {
    if (
      (this.params.mgd != 1 &&
        this.params.mgd != 2)
    ) throw new ErrorAPI("nope")
  }

  public async execute() {
    const currentEvent = await this.event.getEventStatus(this.event.TYPES.FESTIVAL)
    if (currentEvent.active === false) throw new ErrorAPI(720)

    let data = await this.connection.first("SELECT * FROM event_festival_users WHERE user_id = :user AND event_id = :event AND reset_setlist_number != 1010101", {
      user: this.user_id,
      event: currentEvent.id
    })
    if (!data) throw new ErrorAPI("session is missing")
    if (data.reset_setlist_number > data.reset_setlist_number + 1) throw new ErrorAPI("you can't reset setlist")

    let response = {
      live_track_ids: <number[]>[],
      reset_setlist_number: data.reset_setlist_number + 1,
      max_reset_setlist: Config.modules.festival.max_reset_setlist,
      next_reset_setlist_cost: {
        cost_type: Config.modules.festival.reset_cost_type,
        cost_value: Config.modules.festival.reset_cost_value
      },
      before_user_info: await this.user.getUserInfo(this.user_id),
      after_user_info: {}
    }

    if (response.before_user_info[convertCost(Config.modules.festival.reset_cost_type)] < Config.modules.festival.reset_cost_value)
      throw new ErrorAPI("not enough cost")

    await this.connection.query(`UPDATE users SET ${convertCost(Config.modules.festival.reset_cost_type)} = ${convertCost(Config.modules.festival.reset_cost_type)} - ${Config.modules.festival.reset_cost_value} WHERE user_id = :user`, {
      user: this.user_id
    })
    response.after_user_info = await this.user.getUserInfo(this.user_id)

    let attribute = [1, 2, 3].randomValue() // select random attribute
    let param = await this.user.getParams(this.user_id, ["festival_setList"])

    let setListMemberCategory = []
    switch (param.festival_setList) {
      case FESTIVAL_SETLIST.MUSE: {
        setListMemberCategory.push(1)
        break
      }
      case FESTIVAL_SETLIST.AQOURS: {
        setListMemberCategory.push(2)
        break
      }
      case FESTIVAL_SETLIST.MGD: {
        setListMemberCategory.push(this.params.mgd)
        break
      }
      default: {
        setListMemberCategory.push(1, 2)
      }
    }

    const availableLiveSettingIds = this.live.getAvailableLiveSettingIds().join(",")
    const festivalLiveSettingIds = await festDB.all(`SELECT live_setting_id FROM event_festival_live_m WHERE live_setting_id IN (${availableLiveSettingIds})`)
    const trackIds = await liveDB.all(`
    SELECT
      live_track_m.live_track_id
    FROM
      live_setting_m
    INNER JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
    WHERE
      attribute_icon_id = :atb AND
      live_setting_id IN (${festivalLiveSettingIds.map(live => live.live_setting_id).join(",")}) AND
      member_category IN (${setListMemberCategory.join(",")})`, {
      atb: attribute
    })

    while (response.live_track_ids.length < data.count) {
      let randomLive: number = trackIds.randomValue().live_track_id
      if (!response.live_track_ids.includes(randomLive)) response.live_track_ids.push(randomLive)
    }

    await this.connection.query(`UPDATE event_festival_users SET track_ids=:ids, reset_setlist_number=reset_setlist_number+1, attribute=:atb WHERE user_id=:user AND event_id=:event`, {
      ids: response.live_track_ids.join(","),
      atb: attribute,
      user: this.user_id,
      event: currentEvent.id
    })

    return {
      status: 200,
      result: response
    }
  }
}
