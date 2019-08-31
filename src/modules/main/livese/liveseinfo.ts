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
    let liveSE: number[] = [1, 99]
    let list = Config.modules.liveSe.list
    for (let i = 0; i < list.length; i++) {
      let se = list[i]
      if (se != <any>list[i]) return
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