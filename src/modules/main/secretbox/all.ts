import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Secretbox } from "../../../common/secretbox"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const secretbox = new Secretbox(this.connection)

    let data = await this.connection.first("SELECT sns_coin, unit_max, box_gauge, bt_tickets, green_tickets, (SELECT count(*) FROM units WHERE user_id=:user AND deleted=0) as unit_count FROM users WHERE user_id=:user", { 
      user: this.user_id 
    })
    let sbList = await secretbox.generateList(this.user_id)
    let response: any = {
      use_cache: 1,
      is_unit_max: data.unit_count >= data.unit_max,
      item_list: [
        {
          item_id: 1,
          amount: data.green_tickets
        },
        {
          item_id: 5,
          amount: data.bt_tickets
        }
      ],
      gauge_info: {
        max_gauge_point: 100,
        gauge_point: data.box_gauge
      },
      member_category_list: [
        {
          member_category: 1,
          page_list: []
        },
        {
          member_category: 2,
          page_list: []
        }
      ]
    }

    await sbList.forEachAsync(async(secretbox) => {
      let category = secretbox.secret_box_info.member_category
      secretbox.secret_box_info.member_category = undefined
      if (category === 0) {
        response.member_category_list[0].page_list.push(secretbox)
        response.member_category_list[1].page_list.push(secretbox)
        return
      } else {
        response.member_category_list[<number>category - 1].page_list.push(secretbox)
      }
    })

    return {
      status: 200,
      result: response
    }
  }
}