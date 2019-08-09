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

  public async execute() {
    let exchangeItem = await this.connection.query(`SELECT * FROM exchange_item WHERE (start_date < :now AND end_date > :now) OR end_date IS NULL`, { 
      now: Utils.toSpecificTimezone(9)
    })
    
    return {
      status: 200,
      result: {
        exchange_item_info: await Promise.all(exchangeItem.map(async item => {
          let cost = await this.connection.query(`SELECT rarity, cost_value FROM exchange_cost WHERE exchange_item_id = :id`, {
            id: item.exchange_item_id
          })
          let gotCount = await this.connection.first(`SELECT got_item_count FROM exchange_log WHERE exchange_item_id = :id AND user_id = :user`, {
            id: item.exchange_item_id,
            user: this.user_id
          })
          if (!gotCount) gotCount = { got_item_count: 0 }
          let _i = Item.nameToType(item.item_name, item.item_id)
          return {
            exchange_item_id: item.exchange_item_id,
            title: item.title,
            cost_list: cost,
            amount: item.amount,
            add_type: _i.itemType,
            item_id: _i.itemId,
            is_rank_max: false,
            got_item_count: gotCount.got_item_count,
            max_item_count: item.max_count == null ? undefined : item.max_count,
            term_end_date: item.end_date == null ? undefined : item.end_date
          }
        })),
        exchange_point_list: await this.connection.query("SELECT rarity, exchange_point FROM user_exchange_point WHERE user_id=:user", { 
          user: this.user_id 
        })
      }
    }
  }
}