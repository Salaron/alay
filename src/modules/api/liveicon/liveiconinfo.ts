import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const liveIcon: number[] = [1, 2, 3]
    const list = Config.modules.liveIcon.list
    for (const icon of list) {
      if (!liveIcon.includes(icon)) liveIcon.push(icon)
    }
    return {
      status: 200,
      result: {
        live_notes_icon_list: liveIcon
      }
    }
  }
}
