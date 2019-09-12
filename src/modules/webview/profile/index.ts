import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"
import assert from "assert"
import moment from "moment"
import { Utils } from "../../../common/utils"

const unitDB = sqlite3.getUnit()
const liveDB = sqlite3.getLive()

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const i18n = new I18n(this.connection)
    const webview = new WebView(this.connection)
    let userId = this.user_id
    if (Type.isString(this.params.id)) {
      assert(parseInt(this.params.id), "id should be int")
      userId = parseInt(this.params.id)
    }

    let code = await i18n.getUserLocalizationCode(this.user_id)
    let [strings, template, user, userScore, eventData, liveData, liveData2, currentOnline, changeLanguageModal] = await Promise.all([
      i18n.getStrings(code, "common", "profile-index"),
      WebView.getTemplate("profile", "index"),
      this.connection.first(`
      SELECT 
        users.user_id, name, introduction, users.insert_date as registrationDate, 
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
      this.connection.first(`SELECT (IFNULL(SUM(hi_score), 0) + (SELECT IFNULL(SUM(score), 0) FROM user_live_log WHERE user_id = :user)) as total FROM user_live_status WHERE user_id = :user`, { user: userId }),
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
      this.connection.query("SELECT * FROM user_live_log WHERE user_id = :user AND live_difficulty_id IS NULL", { user: userId }),
      webview.getCurrentOnline(),
      webview.getLanguageModalTemplate(this.user_id)
    ])

    let icons = await unitDB.get("SELECT normal_icon_asset, rank_max_icon_asset FROM unit_m WHERE unit_id = :unit", {
      unit: user.unit_id
    })

    let total = 0
    let totalWithLow = 0
    await Promise.all(liveData.map(async live => {
      let time = await liveDB.get("SELECT live_time FROM live_setting_m JOIN live_time_m ON live_setting_m.live_track_id = live_time_m.live_track_id WHERE live_setting_id = :lsid", {
        lsid: live.live_setting_id
      })
      totalWithLow += time.live_time * (live.clear_cnt || 1)
      if (live.hi_combo > 50 && live.clear_cnt < 250) total += time.live_time * (live.clear_cnt || 1)
    }))
    await Promise.all(liveData2.map(async live => {
      let time = await liveDB.get("SELECT live_time FROM live_setting_m JOIN live_time_m ON live_setting_m.live_track_id = live_time_m.live_track_id WHERE live_setting_id = :lsid", {
        lsid: live.live_setting_id
      })
      totalWithLow += time.live_time
      if (live.combo > 50) total += time.live_time
    }))
    user.playTime = `${parseInt(moment.utc(Math.floor(total * 1000)).format("D")) - 1}`
    user.playTime += `d ${moment.utc(Math.floor(total * 1000)).format("H[h] m[m] s[s]")}`
    user.playTimeWithLowCombo = `${parseInt(moment.utc(Math.floor(totalWithLow * 1000)).format("D")) - 1}`
    user.playTimeWithLowCombo += `d ${moment.utc(Math.floor(totalWithLow * 1000)).format("H[h] m[m] s[s]")}`
    user.registrationDateFormated = moment(user.registrationDate).locale(code).format("MMMM YYYY")
    user.registrationDate = moment(user.registrationDate).locale(code).format("DD MMMM YYYY HH:mm:ss zz")
    user.totalScore = userScore.total

    let haveMoreEventData = eventData.length > 3
    eventData.pop()
    let values = {
      i18n: strings,
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      user,
      eventData,
      haveMoreEventData,
      currentOnline,
      changeLanguageModal,
      userId,
      haveEventData: eventData.length != 0,
      icon: user.display_rank === 1 ? icons.normal_icon_asset : icons.rank_max_icon_asset
    }

    return {
      status: 200,
      result: template(values)
    }
  }
}