import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

const itemDB = sqlite3.getItemDB()
export default class extends WebViewAction {
  public requiredAuthLevel = AUTH_LEVEL.ADMIN
  public requestType = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const itemList = await itemDB.all("SELECT item_id, name FROM kg_item_m")
    const locals = {
      i18n: await this.i18n.getStrings(),
      pageTitle: "New Secretbox",
      itemList
    }
    return {
      status: 200,
      result: await this.webview.renderTemplate("admin", "secretbox", locals)
    }
  }
}
