import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
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