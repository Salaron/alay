import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes() {
    return {}
  }
  public paramCheck() {
    return true
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