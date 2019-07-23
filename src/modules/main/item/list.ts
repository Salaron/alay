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
    let response = {
      general_item_list: <any[]>[],
      buff_item_list: []
    }
    let items = await this.connection.first("SELECT green_tickets, bt_tickets FROM users WHERE user_id = :user", { 
      user: this.user_id 
    })
    // green tickets
    response.general_item_list.push({
      item_id: 1,
      amount: items.green_tickets,
      use_button_flag: true,
      general_item_type: 1
    })
    // blue tickets
    response.general_item_list.push({
      item_id: 5,
      amount: items.bt_tickets,
      use_button_flag: true,
      general_item_type: 1
    })

    return {
      status: 200,
      result: response
    }
  }
}