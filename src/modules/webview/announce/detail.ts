import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { WebView } from "../../../common/webview"
import { TYPE } from "../../../common/type"
import { showdownConverter } from "../../../common/i18n"
import assert from "assert"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

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
      WebView.getTemplate("announce", "detail"),
      this.connection.first("SELECT * FROM webview_announce WHERE id = :id AND body IS NOT NULL", {
        id: this.params.id
      })
    ])
    if (!announce) throw new Error("Announce doesn't have a body")

    announce.body = showdownConverter.makeHtml(announce.body.replace(/--/gi, "—"))
    const values = {
      announce,
      external: this.requestData.requestFromBrowser
    }
    return {
      status: 200,
      result: template(values)
    }
  }
}
