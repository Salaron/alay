import RequestData from "../../../core/requestData"
import moment from "moment"
import { AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"

const liveDB = sqlite3.getLive()
const convertRank = <any>{
  1: "S",
  2: "A",
  3: "B",
  4: "C",
  5: "D"
}
const convertDifficulty = <any>{
  1: "Easy",
  2: "Normal",
  3: "Hard",
  4: "Expert",
  5: "",
  6: "Master"
}

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      offset: TYPE.INT,
      limit: TYPE.INT,
      userId: TYPE.INT
    }
  }

  public async execute() {
    const i18n = new I18n(this.connection)

    let code = await i18n.getUserLocalizationCode(this.user_id)
    let [strings, template, liveDataLog, total] = await Promise.all([
      i18n.getStrings(code, "profile-index"),
      WebView.getTemplate("profile", "lastactivitydata"),
      this.connection.query(`SELECT * FROM user_live_log WHERE user_id = :user ORDER BY insert_date DESC LIMIT ${this.params.offset}, ${this.params.limit}`, {
        user: this.params.userId
      }),
      this.connection.first("SELECT COUNT(*) as count FROM user_live_log WHERE user_id = :user", { user: this.params.userId })
    ])

    let lastActivity = await Promise.all(liveDataLog.map(async live => {
      if (!live.live_setting_id && !live.live_setting_ids) throw new Error("live setting id is missing")

      // mf support
      let liveSettingId = live.live_setting_id === null ? live.live_setting_ids.split(",") : live.live_setting_id
      let liveInfoList = await liveDB.all(`
      SELECT 
        name, stage_level, s_rank_combo, s_rank_score, difficulty, live_time 
      FROM live_setting_m 
      JOIN live_time_m ON live_setting_m.live_track_id = live_time_m.live_track_id 
      JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
      WHERE live_setting_id IN (:lsids)`, {
        lsids: liveSettingId
      })

      let songNames = []
      live.s_rank_combo = 0
      live.s_rank_score = 0
      for (let liveInfo of liveInfoList) {
        songNames.push(`${liveInfo.name} (${convertDifficulty[liveInfo.difficulty]} ${liveInfo.stage_level}☆)`)
        live.s_rank_combo += liveInfo.s_rank_combo
        live.s_rank_score += liveInfo.s_rank_score
      }

      live.name = songNames.join("\n")
      live.timeAgo = moment.duration(moment(live.insert_date).diff(Date.now())).locale(code).humanize(true)
      live.score_rank = convertRank[live.score_rank]
      live.combo_rank = convertRank[live.combo_rank]

      return live
    }))

    return {
      status: 200,
      result: {
        total: total.count,
        added: lastActivity.length,
        data: template({
          lastActivity,
          i18n: strings
        })
      }
    }
  }
}