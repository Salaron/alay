import assert from "assert"
import moment from "moment"
import { showdownConverter } from "../../../common/i18n"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      id: TYPE.STRING
    }
  }
  public paramCheck() {
    assert(parseInt(this.params.id) === parseInt(this.params.id), "id should be int")
  }
  public async execute() {
    const [template, announce] = await Promise.all([
      this.webview.getTemplate("announce", "detail"),
      this.connection.first("SELECT * FROM webview_announce WHERE id = :id AND body IS NOT NULL", {
        id: this.params.id
      })
    ])
    if (!announce) throw new Error("Announce doesn't have a body")

    announce.body = showdownConverter.makeHtml(announce.body.replace(/--/gi, "—"))
    announce.date = moment(announce.insert_date).format("DD.MM.YYYY H:mm")

    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, {
        announce,
        pageTitle: announce.title
      })
    }
  }
}
