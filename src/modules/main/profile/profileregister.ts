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
      introduction: TYPE.STRING
    }
  }
  public paramCheck() {
    if (this.params.introduction.length > 200) throw new ErrorCode(1234, "Too long introduction")
  }

  public async execute() {
    try {
      await this.connection.query(`UPDATE users SET introduction = :intro WHERE user_id = :user`, { 
        intro: this.params.introduction, 
        user: this.params.user_id 
      })
    } catch (err){
      throw new ErrorCode(1234, "Used banned characters")
    }

    return {
      status: 200,
      result: []
    }
  }
}