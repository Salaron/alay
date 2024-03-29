import moment from "moment"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

const unitDB = sqlite3.getUnitDB()
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

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let userId = this.user_id

    const guest = this.requestData.auth_level < AUTH_LEVEL.CONFIRMED_USER
    if (Type.isString(this.params.id)) {
      if (!parseInt(this.params.id)) return {
        status: 500,
        result: "id should be int"
      }
      userId = parseInt(this.params.id)
    } else if (guest) {
      return {
        status: 500,
        result: "You are not authorized. To get profile information for a specific account, specify the account id in querystring (profile/index?id= )"
      }
    }

    let code = await this.i18n.getUserLocalizationCode(this.requestData)

    const [strings, template, user, userScore, eventData, liveDataStatus, liveDataLog] = await Promise.all([
      this.i18n.getStrings(code, "profile-index"),
      WebView.getTemplate("profile", "index"),
      this.connection.first(`
      SELECT
        users.user_id, users.level, name, introduction, users.insert_date as registrationDate,
        users.last_login,
        (SELECT last_activity FROM user_login WHERE user_id = :user) as last_activity,
        (SELECT COUNT(*) FROM login_received_list WHERE user_id = :user) as daysInTheGame,
        (
          (SELECT IFNULL(SUM(clear_cnt), 0) FROM user_live_status WHERE user_id=:user AND hi_combo > 150) +
          (SELECT IFNULL(SUM(lives_played), 0) FROM event_ranking WHERE user_id=:user)
        ) AS livesPlayed,
        (SELECT GREATEST(IFNULL(MAX(hi_combo), 0), (SELECT IFNULL(MAX(combo), 0) FROM user_live_log WHERE user_id = :user)) FROM user_live_status WHERE user_id = :user) as maxCombo,
        units.unit_id, units.display_rank,
        FIND_IN_SET(users.level, (SELECT GROUP_CONCAT(level ORDER BY level DESC) FROM users)) AS rank
      FROM users
        JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
        JOIN user_unit_deck_slot
          ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id
          AND users.main_deck=user_unit_deck_slot.deck_id
        JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
      WHERE users.user_id = :user`, {
        user: userId
      }),
      this.connection.first(`SELECT IFNULL(SUM(score), 0) as total FROM user_live_log WHERE user_id = :user`, { user: userId }),
      this.connection.query(`
      SELECT
        name as type, start_date, end_date, lives_played,
        FIND_IN_SET(score, (SELECT GROUP_CONCAT( score ORDER BY score DESC) FROM event_ranking WHERE event_id = events_list.event_id)) AS scoreRank,
        FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id = events_list.event_id AND event_point != 0)) AS ptRank
      FROM event_ranking
      LEFT JOIN events_list ON event_ranking.event_id = events_list.event_id
      WHERE user_id = :user ORDER BY end_date DESC`, {
        user: userId
      }),
      this.connection.query("SELECT * FROM user_live_status WHERE user_id = :user AND status = 2", { user: userId }),
      this.connection.query("SELECT * FROM user_live_log WHERE user_id = :user AND insert_date >= :week ORDER BY insert_date DESC", {
        user: userId,
        week: moment().subtract(1, "week").format("YYYY-MM-DD HH:mm:ss")
      })
    ])

    if (!user) return {
      status: 404,
      result: "User not exists"
    }
    const icons = await unitDB.get("SELECT normal_icon_asset, rank_max_icon_asset FROM unit_m WHERE unit_id = :unit", {
      unit: user.unit_id
    })

    let total = 0

    // promise.all of promise.all?
    let [recentPlays]: any[] = await Promise.all([
      Promise.all(liveDataLog.map(async (live: any, index: number) => {
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
          if (live.combo > 100 && live.is_event) total += liveInfo.live_time
          songInfo.push({
            name: liveInfo.name,
            difficulty: `${convertDifficulty[liveInfo.difficulty]} ${liveInfo.stage_level}☆`
          })
          live.s_rank_combo += liveInfo.s_rank_combo
          live.s_rank_score += liveInfo.s_rank_score
        }
        if (index > 3) return

        live.songInfo = songInfo
        live.timeAgo = moment.duration(moment(live.insert_date).diff(Date.now())).locale(code).humanize(true)
        live.score_rank = convertRank[live.score_rank]
        live.combo_rank = convertRank[live.combo_rank]
        live.mods = await this.user.getModsString(1, live.mods)

        return live
      })),
      Promise.all(liveDataStatus.map(async (live: any) => {
        const time = await liveDB.get("SELECT live_time FROM live_setting_m JOIN live_time_m ON live_setting_m.live_track_id = live_time_m.live_track_id WHERE live_setting_id = :lsid", {
          lsid: live.live_setting_id
        })
        if (live.hi_combo > 100) total += time.live_time * (live.clear_cnt || 1)
      }))
    ])

    user.playTime = `${parseInt(moment.utc(Math.floor(total * 1000)).format("D")) - 1}`
    user.playTime += `d ${moment.utc(Math.floor(total * 1000)).format("H[h] m[m]")}`
    user.registrationDateFormated = moment(user.registrationDate).locale(code).format("MMMM YYYY")
    user.registrationDate = moment(user.registrationDate).locale(code).format("DD MMMM YYYY HH:mm:ss")
    let diff = moment(user.last_activity || user.last_login).diff(Date.now(), "m")
    if (diff < -5) {
      user.lastLoginFormated = strings.lastSeen + moment.duration(diff, "m").locale(code).humanize(true)
      user.lastLogin = moment(user.last_activity || user.last_logi).locale(code).format("DD MMMM YYYY HH:mm:ss")
    } else user.lastLoginFormated = strings.online
    user.totalScore = userScore.total

    recentPlays = recentPlays.slice(0, 4)
    const haveMoreEventData = eventData.length > 3
    const haveMoreRecentPlays = recentPlays.length > 3
    if (haveMoreEventData) eventData.pop()
    if (haveMoreRecentPlays) recentPlays.pop()
    const values = {
      i18n: strings,
      user,
      eventData,
      haveMoreEventData,
      haveMoreRecentPlays,
      recentPlays,
      profileId: userId,
      guest,
      langCode: code,
      icon: user.display_rank === 1 ? icons.normal_icon_asset : icons.rank_max_icon_asset
    }

    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, values)
    }
  }
}
