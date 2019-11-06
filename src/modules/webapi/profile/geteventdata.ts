import { TYPE } from "../../../common/type"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"

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
    const [strings, template, eventData, total] = await Promise.all([
      this.i18n.getStrings(this.params.lang, "profile-index"),
      WebView.getTemplate("profile", "eventdata"),
      this.connection.query(`
      SELECT
        name as type, start_date, end_date, lives_played,
        FIND_IN_SET(score, (SELECT GROUP_CONCAT( score ORDER BY score DESC) FROM event_ranking WHERE event_id = events_list.event_id)) AS scoreRank,
        FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id = events_list.event_id AND event_point != 0)) AS ptRank
      FROM event_ranking
      RIGHT JOIN events_list ON event_ranking.event_id = events_list.event_id
      WHERE user_id = :user ORDER BY end_date DESC LIMIT ${this.params.offset}, ${this.params.limit}`, {
        user: this.params.userId
      }),
      this.connection.first(`
      SELECT
        count(*) as count
      FROM event_ranking
      RIGHT JOIN events_list ON event_ranking.event_id = events_list.event_id
      WHERE user_id = :user`, { user: this.params.userId })
    ])

    const values = {
      i18n: strings,
      eventData
    }

    return {
      status: 200,
      result: {
        total: total.count,
        added: eventData.length,
        data: template(values)
      }
    }
  }
}
