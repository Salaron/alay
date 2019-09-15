import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import moment from "moment"
import { TYPE } from "../../../common/type"
import { I18n } from "../../../common/i18n"
import { WebView } from "../../../common/webview"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      offset: TYPE.INT,
      limit: TYPE.INT,
      langCode: TYPE.STRING
    }
  }

  public async execute() {

    let [strings, template, announceList] = await Promise.all([ // tslint:disable-line
      new I18n(this.connection).getStrings(this.params.langCode, "announce-index"),
      WebView.getTemplate("announce", "announcelist"),
      this.connection.query(`SELECT * FROM webview_announce ORDER BY insert_date DESC LIMIT ${this.params.offset}, ${this.params.limit}`)
    ])

    announceList = announceList.map((announce) => {
      return {
        id: announce.id,
        title: announce.title,
        date: moment(announce.insert_date).format("DD.MM.YYYY H:mm"),
        description: announce.description.replace(/--/g, "—"),
        extendable: announce.body != null
      }
    })

    return {
      status: 200,
      result: {
        announceList: template({
          i18n: strings,
          announceList
        }),
        total: (await this.connection.first(`SELECT COUNT(*) as cnt FROM webview_announce`)).cnt
      }
    }
  }
}
