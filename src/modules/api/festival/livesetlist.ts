import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, FESTIVAL_SETLIST, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const liveDB = sqlite3.getLive()
const festDB = sqlite3.getFestival()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      live_count: TYPE.INT,
      mgd: TYPE.INT
    }
  }
  public paramCheck() {
    if (
      this.params.live_count < 0 ||
      this.params.live_count > 3 ||
      (this.params.mgd != 1 &&
      this.params.mgd != 2)
    ) throw new ErrorAPI("nope")
  }

  public async execute() {
    const currentEvent = await this.eventStub.getEventStatus(this.eventStub.TYPES.FESTIVAL)
    if (currentEvent.active === false) throw new ErrorAPI(720)

    let response = {
      live_track_ids: <number[]>[],
      reset_setlist_number: 0,
      max_reset_setlist: Config.modules.festival.max_reset_setlist,
      next_reset_setlist_cost: {
        cost_type: Config.modules.festival.reset_cost_type,
        cost_value: Config.modules.festival.reset_cost_value
      }
    }

    let data = await this.connection.first("SELECT reset_setlist_number, track_ids FROM event_festival_users WHERE user_id = :user AND event_id = :event AND reset_setlist_number != 1010101", {
      user: this.user_id,
      event: currentEvent.id
    })
    if (data) {
      response.reset_setlist_number = data.reset_setlist_number
      response.live_track_ids = data.track_ids.split(",").map(Number)
      return {
        status: 200,
        result: response
      }
    }

    let attribute = [1, 2, 3].randomValue() // select random attribute
    let param = await this.user.getParams(this.user_id, ["festival_setList"])

    let setListMemberCategory = []
    switch (param.festival_setList) {
      case FESTIVAL_SETLIST.MUSE: {
        setListMemberCategory.push(1, 3)
        break
      }
      case FESTIVAL_SETLIST.AQOURS: {
        setListMemberCategory.push(2, 3)
        break
      }
      case FESTIVAL_SETLIST.MGD: {
        setListMemberCategory.push(this.params.mgd, 3)
        break
      }
      default: {
        setListMemberCategory.push(1, 2, 3)
      }
    }

    const festivalLiveSettingIds = await festDB.all(`SELECT live_setting_id FROM event_festival_live_m WHERE live_setting_id IN (${this.live.availableLiveList.join(",")})`)
    let trackIds = await liveDB.all(`
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
    // if none match, then select from all
    if (trackIds.length === 0) trackIds = await liveDB.all(`
    SELECT
      live_track_m.live_track_id
    FROM
      live_setting_m
    INNER JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
    WHERE
      attribute_icon_id = :atb AND
      live_setting_id IN (${festivalLiveSettingIds.map(live => live.live_setting_id).join(",")})`, {
      atb: attribute
    })

    while (response.live_track_ids.length < this.params.live_count) {
      let randomLive: number = trackIds.randomValue().live_track_id
      if (!response.live_track_ids.includes(randomLive)) response.live_track_ids.push(randomLive)
    }

    await this.connection.query("INSERT INTO event_festival_users (event_id, user_id, attribute, count, reset_setlist_number, track_ids) VALUES (:eventId, :user,:atb, :count, 0, :ids) ON DUPLICATE KEY UPDATE \
    attribute=:atb, count=:count, reset_setlist_number=0, track_ids=:ids", {
      eventId: currentEvent.id,
      user: this.user_id,
      atb: attribute,
      count: this.params.live_count,
      ids: response.live_track_ids.join(",")
    })

    return {
      status: 200,
      result: response
    }
  }
}
