import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

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

  public paramTypes() {
    return {
      user_id: TYPE.INT
    }
  }

  public async execute() {
    let res = await this.connection.execute(`DELETE FROM user_friend WHERE initiator_id = :thisUser AND recipient_id = :recUser AND status = 0`, {
      thisUser: this.user_id,
      recUser: this.params.user_id
    })
    // remove notice
    await this.connection.execute(`DELETE FROM user_notice WHERE filter_id = 6 AND affector_id = :aff AND receiver_id = :rec LIMIT 1`, {
      aff: this.user_id,
      rec: this.params.user_id
    })
    return {
      status: 200,
      result: { 
        is_friend: res.affectedRows != 1
      }
    }
  }
}