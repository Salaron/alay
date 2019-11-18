import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: {
        restriction_info: {
          restricted: false
        },
        sns_product_list: [
          {
            product_id: "Test",
            name: "a",
            price: 0,
            can_buy: false,
            product_type: 2,
            item_list: [
              {
                item_id: 4,
                add_type: 3001,
                amount: 1,
                is_freebie: false
              }
            ]
          }
        ],
        product_list: [
        ],
        subscription_list: [
        ],
        show_point_shop: true
      }
    }
  }
}
