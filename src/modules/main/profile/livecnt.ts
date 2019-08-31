import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"

const liveDB = sqlite3.getLive()

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      user_id: TYPE.INT
    }
  }

  public async execute() {
    let response = [
      { difficulty: 1, clear_cnt: 0 },
      { difficulty: 2, clear_cnt: 0 },
      { difficulty: 3, clear_cnt: 0 },
      { difficulty: 4, clear_cnt: 0 },
      { difficulty: 6, clear_cnt: 0 }
    ]

    let rows = await this.connection.query("SELECT live_setting_id FROM user_live_status WHERE user_id = :user", {
      user: this.params.user_id
    })
    await Promise.all(rows.map(async (row: any) => {
      let d = await liveDB.get("SELECT difficulty FROM live_setting_m WHERE live_setting_id = :s", {
        s: row.live_setting_id
      })
      switch (d.difficulty) {
        case 1: return response[0].clear_cnt++ // Easy
        case 2: return response[1].clear_cnt++ // Normal
        case 3: return response[2].clear_cnt++ // Hard
        case 4:                                // Expert
        case 5: return response[3].clear_cnt++ // Expert (random) a.k.a. Technical
        case 6: return response[4].clear_cnt++ // Master
      }
    }))

    return {
      status: 200,
      result: response
    }
  }
}