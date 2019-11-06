import { TYPE } from "../../../common/type"
import { User } from "../../../common/user"
import { Log } from "../../../core/log"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

const log = new Log("reward/openAll")

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
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
    const rarityUnits = this.unit.rarityUnits
    const attributeUnits = this.unit.attributeUnits
    this.params.filter.map(Number)

    let rewardListQuery = ``
    let rewardCountQuery = ``
    switch (this.params.category) {
      case 0: {
        // All
        const orderList = ["DESC", "ASC", "DESC"]
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND opened_date IS NULL ORDER BY insert_date ${orderList[this.params.order]} LIMIT 1000`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND opened_date IS NULL`
        break
      }
      case 1: {
        // Members
        const orderList = ["DESC", "ASC", "DESC", "ASC"]
        let filter = ``
        if (this.params.filter.length != 2) throw new Error(`Invalid filter`)
        if (this.params.filter[0] != 0 && rarityUnits[this.params.filter[0]]) {
          filter = ` AND item_id IN (${rarityUnits[this.params.filter[0]]})`
        }
        if (this.params.filter[1] != 0 && attributeUnits[this.params.filter[1]]) {
          filter = filter + ` AND item_id IN (${attributeUnits[this.params.filter[1]]})`
        }
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND opened_date IS NULL ${filter} ORDER BY insert_date LIMIT 1000`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND opened_date IS NULL ${filter} `
        break
      }
      case 2: {
        // Items
        const orderList = ["DESC", "ASC", "DESC"]
        let filter = ``
        if (this.params.filter[0] != 0) filter = ` AND item_type IN (${this.params.filter.join(",")})`
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND opened_date IS NULL ${filter} ORDER BY insert_date ${orderList[this.params.order]} LIMIT 1000`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND opened_date IS NULL ${filter}`
        break
      }
      default: throw new Error(`Invalid category`)
    }

    const rewardList = await this.connection.query(rewardListQuery)
    const rewardCount = await this.connection.first(rewardCountQuery)

    const itemList = <any[]>[]
    const beforeUserInfo = await this.user.getUserInfo(this.user_id)

    // do async openning
    const opened = await Promise.all(rewardList.map((reward: any) => this.item.openPresent(this.user_id, reward.incentive_id).catch((err: Error) => {
      log.error(err) // log errors
      return undefined // return undefined if there an error
    })))
    for (const result of opened) {
      if (!Type.isNullDef(result)) itemList.push(result)
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
        after_user_info: await this.user.getUserInfo(this.user_id),
        class_system: User.getClassSystemStatus(this.user_id),
        unit_support_list: await this.user.getSupportUnits(this.user_id)
      }
    }
  }
}
