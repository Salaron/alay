import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const data = await this.connection.first("SELECT sns_coin, unit_max, box_gauge, bt_tickets, green_tickets, (SELECT count(*) FROM units WHERE user_id=:user AND deleted=0) as unit_count FROM users WHERE user_id=:user", {
      user: this.user_id
    })

    const [musePageList, aqoursPageList] = await Promise.all([
      this.secretbox.getSecretboxPageList(1),
      this.secretbox.getSecretboxPageList(2)
    ])

    const response: any = {
      is_unit_max: false,
      item_list: [
        // TODO
        {
          item_id: 1,
          amount: data.green_tickets
        },
        {
          item_id: 5,
          amount: data.bt_tickets
        },
        {
          item_id: 8,
          amount: Math.floor(data.green_tickets / 10)
        }
      ],
      gauge_info: {
        max_gauge_point: 100,
        gauge_point: data.box_gauge
      },
      member_category_list: [
        musePageList,
        aqoursPageList
      ]
    }

    return {
      status: 200,
      result: response
    }
  }
}
