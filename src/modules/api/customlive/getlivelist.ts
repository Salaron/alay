import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

const customLiveDB = sqlite3.getCustomLiveSVDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const liveList = await Promise.all((await customLiveDB.all("SELECT * FROM custom_live")).map(async live => {
      const setting = await customLiveDB.get("SELECT * FROM custom_live_setting WHERE custom_live_id = :id", {
        id: live.custom_live_id
      })
      const user = await this.connection.first(`
      SELECT
        hi_score, complete_rank, combo_rank, score_rank, status
      FROM
        user_custom_live_status
      WHERE
        user_id = :user AND custom_live_id = :id`, {
        user: this.user_id,
        id: live.custom_live_id
      })
      return {
        custom_live_id: live.custom_live_id,
        name: live.name,
        artist: live.artist,
        mapper: live.mapper,
        source: live.source,
        version: live.version,
        assets: {
          background: live.background,
          cover: live.cover,
          sound: live.sound
        },
        setting,
        user
      }
    }))

    return {
      status: 200,
      result: {
        liveList
      }
    }
  }
}
