import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import { Log } from "../../../core/log"

const log = new Log("reward/openAll")

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
      category: TYPE.INT,
      order: TYPE.INT
    }
  }

  public paramCheck() {
    if (!Type.isArray(this.params.filter) || this.params.filter.length === 0) throw new Error(`Filter should be not empty`)
  }

  public async execute() {
    const user = new User(this.connection)
    const item = new Item(this.connection)
    this.params.filter.map(Number)

    let rewardListQuery = ``
    let rewardCountQuery = ``
    switch (this.params.category) {
      case 0: {
        // All
        const orderList = ["DESC", "ASC", "DESC"]
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND collected IS NULL ORDER BY insert_date ${orderList[this.params.order]} LIMIT 1000`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND collected IS NULL`
        break
      }
      case 1: {
        // Members
        const orderList = ["DESC", "ASC", "DESC", "ASC"]
        let filter = ``
        if (this.params.filter.length != 2) throw new Error(`Invalid filter`)
        if (this.params.filter[0] != 0) {
          filter = ` AND rarity = ${this.params.filter[0]}`
        }
        if (this.params.filter[1] != 0) {
          filter = filter + ` AND attribute = ${this.params.filter[1]}`
        }
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND collected IS NULL ${filter} ORDER BY insert_date LIMIT 1000`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND collected IS NULL ${filter} `
        break
      }
      case 2: {
        // Items
        const orderList = ["DESC", "ASC", "DESC"]
        let filter = ``
        if (this.params.filter[0] != 0) filter = ` AND item_type IN (${this.params.filter.join(",")})`
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND collected IS NULL ${filter} ORDER BY insert_date ${orderList[this.params.order]} LIMIT 1000`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND collected IS NULL ${filter}`
        break
      }
      default: throw new Error(`Invalid category`)
    }

    let rewardList = await this.connection.query(rewardListQuery)
    let rewardCount = await this.connection.first(rewardCountQuery)

    let itemList = <any[]>[]
    let beforeUserInfo = await user.getUserInfo(this.user_id)

    // do async openning
    let opened = await Promise.all(rewardList.map((reward: any) => item.openPresent(this.user_id, reward.incentive_id).catch((err: Error) => {
      log.error(err) // log errors
      return undefined // return undefined if there an error
    })))
    for (let i = 0; i < opened.length; i++) {
      if (!Type.isNullDef(opened[i])) itemList.push(opened[i])
    }

    return {
      status: 200,
      result: {
        reward_num: rewardCount.count,
        opened_num: itemList.length,
        total_num: rewardCount.count,
        order: this.params.order,
        upper_limit: itemList.length === 1000,
        reward_item_list: itemList,
        before_user_info: beforeUserInfo,
        after_user_info: await user.getUserInfo(this.user_id),
        class_system: User.getClassSystemStatus(this.user_id)
      }
    }
  }
}