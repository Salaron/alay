import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

const itemDB = sqlite3.getItemDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const liveSeList = (await itemDB.all("SELECT live_se_id FROM live_se_m")).map(liveSe => liveSe.live_se_id)
    return {
      status: 200,
      result: {
        live_se_list: liveSeList
      }
    }
  }
}
