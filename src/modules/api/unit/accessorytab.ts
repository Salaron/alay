import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: {
        tab_list: [
          this.getTab(1),
          this.getTab(2)
        ]
      }
    }
  }

  private getTab(memberCategory: 1 | 2) {
    return {
      tab_name: memberCategory,
      asset_list: [

      ]
    }
  }
}
