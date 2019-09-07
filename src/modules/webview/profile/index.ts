import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"
import assert from "assert"

const unitDB = sqlite3.getUnit()

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      //id: TYPE.STRING
    }
  }

  public async execute() {
    const i18n = new I18n(this.connection)
    const webview = new WebView(this.connection)
    let userId = this.user_id
    if (Type.isString(this.params.id)) {
      assert(parseInt(this.params.id), "id should be int")
      userId = parseInt(this.params.id)
    }

    let strings = await i18n.getStrings(this.user_id, "common", "profile-index")
    let template = await WebView.getTemplate("profile", "index")

    let user = await this.connection.first(`
    SELECT 
      users.user_id, name, introduction, users.insert_date as registrationDate, 
      (SELECT COUNT(*) FROM login_received_list WHERE user_id = :user) as daysInTheGame,
      ((SELECT IFNULL(SUM(clear_cnt), 0) FROM user_live_status WHERE user_id = :user AND hi_combo > 150)) as livesPlayed,
      units.unit_id, units.display_rank
    FROM users
      JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
      JOIN user_unit_deck_slot 
        ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id 
        AND users.main_deck=user_unit_deck_slot.deck_id 
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    WHERE users.user_id = :user`, {
      user: userId
    })
    let icons = await unitDB.get("SELECT normal_icon_asset, rank_max_icon_asset FROM unit_m WHERE unit_id = :unit", {
      unit: user.unit_id
    })
    let eventData = await this.connection.query(`
    SELECT 
      name as type, start_date, end_date, lives_played,
      FIND_IN_SET(score, (SELECT GROUP_CONCAT( score ORDER BY score DESC) FROM event_ranking WHERE event_id = events_list.event_id)) AS scoreRank,
      FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id = events_list.event_id AND event_point != 0)) AS ptRank
    FROM event_ranking
    LEFT JOIN events_list ON event_ranking.event_id = events_list.event_id
    WHERE user_id = :user ORDER BY end_date DESC`, {
      user: userId
    })

    let values = {
      i18n: strings,
      currentOnline: await webview.getCurrentOnline(),
      isAdmin: Config.server.admin_ids.includes(this.user_id),
      changeLanguageModal: await webview.getLanguageModalTemplate(this.user_id),
      headers: JSON.stringify(this.requestData.getWebapiHeaders()),
      user,
      eventData,
      haveEventData: eventData.length != 0,
      icon: user.display_rank === 1 ? icons.normal_icon_asset : icons.rank_max_icon_asset
    }

    return {
      status: 200,
      result: template(values)
    }
  }
}