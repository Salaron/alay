import moment from "moment"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import assert from "assert"
import { ErrorAPI } from "../../../models/error"
import { showdownConverter } from "../../../common/i18n"

export default class extends WebViewAction {
  public requestType = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel = AUTH_LEVEL.NONE

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

    const announce = await this.connection.first("SELECT * FROM webview_announce WHERE id = :id AND body IS NOT NULL", {
      id: this.params.id
    })
    if (!announce) throw new ErrorAPI("invalid announce")

    announce.body = showdownConverter.makeHtml(announce.body.replace(/--/gi, "—"))
    announce.date = moment(announce.insert_date).format("DD.MM.YYYY HH:mm")
    const locals = {
      announce,
      pageTitle: announce.title
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("announce", "detail", locals)
    }
  }
}
