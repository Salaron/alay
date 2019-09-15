import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramCheck() {
    if (!Type.isArray(this.params.path_list) || this.params.path_list.length === 0) throw new Error(`Path list should be not empty`)
  }

  public async execute() {
    return {
      status: 200,
      result: {
        url_list: this.params.path_list.map((path: any) => {
          return Config.modules.download.microDLurl + path
        })
      }
    }
  }
}
