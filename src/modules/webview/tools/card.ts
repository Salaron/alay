import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import RequestData from "../../../core/requestData"

const unitDB = sqlite3.getUnitDB()

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BROWSER
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    if (!this.params.id) return {
      result: "Please provide an unit number or unit id in querystring as id parameter (prefix n if unit number)",
      status: 200
    }

    let useNumber = false
    if (this.params.id.startsWith("n")) {
      useNumber = true
      this.params.id = this.params.id.substr(1)
    }
    if (isNaN(parseInt(this.params.id))) return {
      result: "",
      status: 403
    }
    let card = await unitDB.get(`SELECT * FROM unit_m WHERE unit_${useNumber ? "number" : "id"} = :num`, { num: this.params.id })
    if (!card) return {
      result: `This card is missing`,
      status: 200
    }
    let result = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SunLight Tools</title><link rel="stylesheet" type="text/css" href="/resources/css/uikit.min.css"></head><body><p>`
    Object.keys(card).map(field => {
      result += `${field}: ${card[field]}<br>`
    })
    result += `</p></body></html>`

    return {
      result,
      status: 200
    }
  }
}
