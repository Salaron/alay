import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
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
        under_age_info: {
          birth_set: true,
          has_limit: false,
          limit_amount: null,
          month_used: 0
        },
        sns_product_list: [
          { product_id: "Fake", name: "a", price: 1, can_buy: false, product_type: 1, item_list: [{ item_id: 4, add_type: 3001, amount: 5, is_freebie: false }] }
        ],
        product_list: [],
        subscription_list: []
      }
    }
  }
}