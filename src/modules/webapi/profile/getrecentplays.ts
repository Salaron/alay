import moment from "moment"
import { TYPE } from "../../../common/type"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"

const liveDB = sqlite3.getLiveDB()
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
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      offset: TYPE.INT,
      limit: TYPE.INT,
      userId: TYPE.INT,
      lang: TYPE.STRING
    }
  }

  public async execute() {
    const code = this.params.lang
    const [strings, template, liveDataLog, total] = await Promise.all([
      this.i18n.getStrings(code, "profile-index"),
      WebView.getTemplate("profile", "recentplays"),
      this.connection.query(`SELECT * FROM user_live_log WHERE user_id = :user AND insert_date >= :week ORDER BY insert_date DESC LIMIT ${this.params.offset}, ${this.params.limit}`, {
        user: this.params.userId,
        week: moment().subtract(1, "week").format("YYYY-MM-DD HH:mm:ss")
      }),
      this.connection.first("SELECT COUNT(*) as count FROM user_live_log WHERE user_id = :user AND insert_date >= :week", {
        user: this.params.userId,
        week: moment().subtract(1, "week").format("YYYY-MM-DD HH:mm:ss")
      })
    ])

    const recentPlays = await Promise.all(liveDataLog.map(async (live: any) => {
      if (!live.live_setting_id && !live.live_setting_ids) throw new Error("live setting id is missing")

      // mf support
      const liveSettingId = live.live_setting_id === null ? live.live_setting_ids.split(",") : live.live_setting_id
      const liveInfoList = await liveDB.all(`
        SELECT
          name, stage_level, s_rank_combo, s_rank_score, difficulty, live_time
        FROM live_setting_m
        JOIN live_time_m ON live_setting_m.live_track_id = live_time_m.live_track_id
        JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
        WHERE live_setting_id IN (:lsids)`, {
        lsids: liveSettingId
      })

      const songInfo = []
      live.s_rank_combo = 0
      live.s_rank_score = 0
      for (const liveInfo of liveInfoList) {
        songInfo.push({
          name: liveInfo.name,
          difficulty: `${convertDifficulty[liveInfo.difficulty]} ${liveInfo.stage_level}☆`
        })
        live.s_rank_combo += liveInfo.s_rank_combo
        live.s_rank_score += liveInfo.s_rank_score
      }

      live.songInfo = songInfo
      live.timeAgo = moment.duration(moment(live.insert_date).diff(Date.now())).locale(code).humanize(true)
      live.score_rank = convertRank[live.score_rank]
      live.combo_rank = convertRank[live.combo_rank]
      live.mods = await this.user.getModsString(1, live.mods)

      return live
    }))

    return {
      status: 200,
      result: {
        total: total.count,
        added: recentPlays.length,
        data: template({
          recentPlays,
          i18n: strings
        })
      }
    }
  }
}
