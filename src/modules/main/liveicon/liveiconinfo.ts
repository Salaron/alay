import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return {}
  }
  public paramCheck() {
    return true
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