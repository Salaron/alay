import moment from "moment"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import executeAction from "../../../handlers/action"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE, RESPONSE_TYPE } from "../../../models/constant"

const liveDB = sqlite3.getLiveDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      member_category: TYPE.INT,
      mgd: TYPE.INT,
      difficulty: TYPE.INT,
      attribute: TYPE.INT
    }
  }
  public paramCheck() {
    return (
      this.params.member_category === this.params.mgd &&
      [1, 2, 3, 4].includes(this.params.difficulty) &&
      [1, 2, 3].includes(this.params.attribute) &&
      (moment().utcOffset("+0900").day() % 3 + 1) === this.params.attribute // same rotation as on official server
    )
  }

  public async execute() {
    const session = await this.connection.first("SELECT * FROM user_live_random WHERE user_id = :user AND attribute = :atb AND difficulty = :difficulty AND member_category = :category", {
      user: this.user_id,
      atb: this.params.attribute,
      difficulty: this.params.difficulty,
      category: this.params.member_category
    })

    let token = Utils.randomString(64)
    if (!session) {
      const ids = await liveDB.all(`
      SELECT
        difficulty.live_difficulty_id
      FROM live_setting_m as setting INNER JOIN (
        SELECT
          live_setting_id, live_difficulty_id, capital_type, capital_value,
          c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
        FROM special_live_m
        UNION
        SELECT
          live_setting_id, live_difficulty_id, capital_type, capital_value,
          c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
        FROM normal_live_m
      ) as difficulty ON setting.live_setting_id = difficulty.live_setting_id
      INNER JOIN live_track_m ON live_track_m.live_track_id = setting.live_track_id
      WHERE
        difficulty = :diff AND attribute_icon_id = :attr AND
        member_category = :category AND setting.live_setting_id IN (${this.live.getAvailableLiveSettingIds().join(",")})`, {
        diff: this.params.difficulty,
        attr: this.params.attribute,
        category: this.params.member_category
      })

      // set random live difficulty id
      this.requestData.params.live_difficulty_id = ids.randomValue().live_difficulty_id.toString()
      await this.connection.execute("INSERT INTO user_live_random (user_id, attribute, difficulty, token, live_difficulty_id, member_category) VALUES (:user, :atb, :difficulty, :token, :ldid, :category)", {
        user: this.user_id,
        atb: this.params.attribute,
        difficulty: this.params.difficulty,
        token,
        ldid: this.requestData.params.live_difficulty_id,
        category: this.params.member_category
      })
    } else {
      this.requestData.params.live_difficulty_id = session.live_difficulty_id.toString()
    }

    const result = (await executeAction("live", "partylist", this.requestData, {
      responseType: RESPONSE_TYPE.SINGLE
    })).result
    result.token = session ? session.token : token

    return {
      status: 200,
      result
    }
  }
}
