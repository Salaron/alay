import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
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
  public paramCheck() {
    return (
      Type.isArray(this.params.difficulty_ids) && this.params.difficulty_ids.length != 0 && this.params.difficulty_ids.length <= 3
    )
  }

  public async execute() {
    const currentEvent = await this.event.getEventById(this.params.event_id)
    if (currentEvent.active === false) throw new ErrorAPI(720)

    let session = await this.connection.first("SELECT * FROM event_festival_users WHERE user_id = :user AND event_id = :event", {
      user: this.user_id,
      event: currentEvent.id
    })
    if (!session) throw new Error(`There is no active festival session`)
    let trackIds = session.track_ids.split(",")
    if (this.params.difficulty_ids.length !== trackIds.length) throw new ErrorAPI(`Track count and diff count doesn't match`)

    let result = {
      festival: {
        event_festival_live_list: <any>[]
      },
      festival_previous_item_ids: [],
      energy_full_time: "2019-04-01 00:00:00",
      over_max_energy: 0,
      available_mission_bonus_list: []
    }

    const params = await this.user.getParams(this.user_id, ["random"])
    result.festival.event_festival_live_list = await Promise.all(this.params.difficulty_ids.map(async (id: number, i: number) => {
      const liveInfo = await liveDB.get(`
      SELECT
        live_setting_id, swing_flag, difficulty
      FROM live_setting_m
        INNER JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
      WHERE live_track_m.live_track_id = :track AND difficulty = :difficulty`, {
        track: trackIds[i],
        difficulty: id
      })
      liveInfo.live_difficulty_id = (
        await festDB.get(`SELECT live_difficulty_id FROM event_festival_live_m WHERE live_setting_id = :lsid`, {
          lsid: liveInfo.live_setting_id
        })
      ).live_difficulty_id
      liveInfo.is_random = liveInfo.difficulty === 5 || params.random === 1
      return liveInfo
    }))

    await this.connection.query(`UPDATE event_festival_users SET difficulty_ids = '${this.params.difficulty_ids.join(",")}' WHERE user_id = :user AND event_id = :event`, {
      user: this.user_id,
      event: currentEvent.id
    })

    return {
      status: 200,
      result
    }
  }
}
