import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

const unitDB = sqlite3.getUnit()

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
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
      category: TYPE.INT
    }
  }

  public paramCheck() {
    if (!Type.isArray(this.params.filter) || this.params.filter.length === 0) throw new Error(`Filter should be not empty`)
    if (this.params.offset) {
      if (!Type.isInt(this.params.offset)) throw new Error(`Invalid offset type`)
    }
  }

  public async execute() {
    this.params.filter.map(Number)

    let id = ``
    if (this.params.incentive_history_id){
      if (typeof this.params.incentive_history_id != "number" || this.params.incentive_history_id != parseInt(this.params.incentive_history_id, 10)) return false
      id = ` AND incentive_id > ${this.params.incentive_history_id}`
    }

    let rewardListQuery = ``
    let rewardCountQuery = ``
    switch (this.params.category) {
      case 0: {
        // All
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND collected = 1 ${id} ORDER BY opened_date DESC LIMIT 20`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND collected = 1`
        break
      }
      case 1: {
        // Members
        let filter = ``
        if (this.params.filter.length != 2) throw new Error(`Invalid filter`)
        if (this.params.filter[0] != 0) {
          filter = ` AND rarity = ${this.params.filter[0]}`
        }
        if (this.params.filter[1] != 0) {
          filter = filter + ` AND attribute = ${this.params.filter[1]}`
        }
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND collected = 1 ${filter} ${id} ORDER BY opened_date DESC LIMIT 20`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND collected IS NULL ${filter} `
        break
      }
      case 2: {
        // Items
        let filter = ``
        if (this.params.filter[0] != 0) filter = ` AND item_type IN (${this.params.filter.join(",")})`
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND collected = 1 ${filter} ${id} ORDER BY opened_date DESC LIMIT 20`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND collected = 1 ${filter}`
        break
      }
      default: throw new Error(`Invalid category`)
    }

    let rewardList = await this.connection.query(rewardListQuery)
    let rewardCount = await this.connection.first(rewardCountQuery)

    let list: any[] = rewardList.map((reward: any) => {
      return {
        incentive_history_id: reward.incentive_id,
        incentive_id: reward.incentive_id,
        incentive_item_id: Item.getIncentiveId(reward.item_type, reward.item_id),
        add_type: reward.item_type,
        amount: reward.amount,
        item_category_id: 0,
        incentive_type: 6100,
        incentive_message: reward.incentive_message,
        insert_date: reward.insert_date,
        opened_date: reward.opened_date,
        is_rank_max: false,
        is_sold: false
      }
    })

    return {
      status: 200,
      result: {
        item_count: rewardCount.count,
        limit: 20,
        history: list
      }
    }
  }
}