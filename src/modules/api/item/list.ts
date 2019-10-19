import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const response = {
      general_item_list: <any[]>[],
      buff_item_list: [],
      reinforce_item_list: [],
      reinforce_info: []
    }
    const items = await this.connection.first("SELECT green_tickets, bt_tickets FROM users WHERE user_id = :user", {
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
