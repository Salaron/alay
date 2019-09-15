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
    const liveSE: number[] = [1, 99]
    const list = Config.modules.liveSe.list
    for (const se of list) {
      if (!liveSE.includes(se)) liveSE.push(se)
    }
    return {
      status: 200,
      result: {
        live_se_list: liveSE
      }
    }
  }
}
