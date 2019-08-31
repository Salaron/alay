import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let liveIcon: number[] = [1, 2, 3]
    let list = Config.modules.liveIcon.list
    for (let i = 0; i < list.length; i++) {
      let icon = list[i]
      if (icon != <any>list[i]) return
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