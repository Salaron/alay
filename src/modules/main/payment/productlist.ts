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