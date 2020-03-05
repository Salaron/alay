import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

const unitDB = sqlite3.getUnitDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
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
    if (this.params.offset) {
      if (!Type.isInt(this.params.offset)) throw new Error(`Invalid offset type`)
    }
  }

  public async execute() {
    const rarityUnits = this.unit.rarityUnits
    const attributeUnits = this.unit.attributeUnits
    const offset = this.params.offset || 0
    this.params.filter.map(Number)

    let rewardListQuery = ``
    let rewardCountQuery = ``
    switch (this.params.category) {
      case 0: {
        // All
        const orderList = ["DESC", "ASC", "DESC"]
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND opened_date IS NULL ORDER BY insert_date ${orderList[this.params.order]} LIMIT ${offset}, 20`
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
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND opened_date IS NULL ${filter} ORDER BY insert_date ${orderList[this.params.order]} LIMIT ${offset}, 20`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type = 1001 AND opened_date IS NULL ${filter} `
        break
      }
      case 2: {
        // Items
        const orderList = ["DESC", "ASC", "DESC"]
        let filter = ``
        if (this.params.filter[0] != 0) filter = ` AND item_type IN (${this.params.filter.join(",")})`
        if (!orderList[this.params.order]) throw new Error(`Invalid order`)
        rewardListQuery = `SELECT * FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND opened_date IS NULL ${filter} ORDER BY insert_date ${orderList[this.params.order]} LIMIT ${offset}, 20`
        rewardCountQuery = `SELECT count(*) as count FROM reward_table WHERE user_id=${this.user_id} AND item_type <> 1001 AND opened_date IS NULL ${filter}`
        break
      }
      default: throw new Error(`Invalid category`)
    }

    const rewardList = await this.connection.query(rewardListQuery)
    const rewardCount = await this.connection.first(rewardCountQuery)

    const list: any[] = await Promise.all(rewardList.map(async (reward: any) => {
      if (reward.item_type != 1001) return {
        incentive_id: reward.incentive_id,
        incentive_item_id: this.item.getIncentiveId(reward.item_type, reward.item_id),
        add_type: reward.item_type,
        amount: reward.amount,
        item_category_id: 0,
        incentive_type: 6100,
        incentive_message: reward.incentive_message,
        insert_date: reward.insert_date,
        remaining_time: "No Expiration"
      }
      const data = await unitDB.get("SELECT * FROM unit_m WHERE unit_id = ?", [reward.item_id])
      if (!data) {
        throw new Error("Can't find data for unit_id #" + reward.item_id)
      }
      return {
        incentive_id: reward.incentive_id,
        incentive_item_id: reward.item_id,
        add_type: reward.item_type,
        amount: reward.amount,
        item_category_id: 0,
        incentive_type: 6000,
        incentive_message: reward.incentive_message,
        insert_date: reward.insert_date,
        remaining_time: "No Expiration",
        max_level: data.before_level_max,
        max_rank: (data.disable_rank_up >= 1 ? 1 : 2),
        max_love: data.before_love_max,
        unit_id: reward.item_id,
        is_support_member: this.unit.getSupportUnitList().includes(reward.item_id),
        exp: 0,
        next_exp: 24,
        max_hp: data.hp_max,
        level: 1,
        skill_level: 1,
        rank: 1,
        love: 0,
        is_rank_max: false,
        is_level_max: false,
        is_love_max: false,
        new_unit_flag: true,
        reward_box_flag: true,
        unit_skill_exp: 0,
        display_rank: 1,
        removable_skill_capacity: data.default_removable_skill_capacity
      }
    }))

    return {
      status: 200,
      result: {
        item_count: rewardCount.count,
        limit: 20,
        order: this.params.order,
        items: list
      }
    }
  }
}
