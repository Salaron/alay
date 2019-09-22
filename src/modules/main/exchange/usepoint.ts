import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { User } from "../../../common/user"
import { Item } from "../../../common/item"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      exchange_item_id: TYPE.INT,
      amount: TYPE.INT,
      rarity: TYPE.INT
    }
  }

  public async execute() {
    const user = new User(this.connection)
    const item = new Item(this.connection)

    const exchangeItem = await this.connection.first(`
    SELECT
      *
    FROM
      exchange_item
    JOIN exchange_cost
      ON exchange_item.exchange_item_id = exchange_cost.exchange_item_id
    WHERE exchange_item.exchange_item_id = :id AND rarity = :rarity`, { id: this.params.exchange_item_id, rarity: this.params.rarity })
    if (!exchangeItem) throw new ErrorCode(4204, "ERROR_CODE_EXCHANGE_INVALID")

    let gotCount = await this.connection.first(`SELECT got_item_count FROM exchange_log WHERE exchange_item_id = :id AND user_id = :user`, {
      id: exchangeItem.exchange_item_id,
      user: this.user_id
    })
    const ep = await this.connection.first(`SELECT exchange_point as count FROM user_exchange_point WHERE user_id = :user AND rarity = :rarity`, {
      user: this.user_id,
      rarity: this.params.rarity
    })
    const beforeUserInfo = await user.getUserInfo(this.user_id)
    if (!gotCount) gotCount = { got_item_count: 0 }
    if (exchangeItem.max_count && gotCount.got_item_count >= exchangeItem.max_count) throw new ErrorCode(4201, "ERROR_CODE_OVER_ADD_EXCHANGE_ITEM_COUNT_MAX_LIMIT")
    if (exchangeItem.end_date && Utils.toSpecificTimezone(9) > exchangeItem.end_date) throw new ErrorCode(4203, "ERROR_CODE_EXCHANGE_ITEM_OUT_OF_DATE")
    if (exchangeItem.cost_value * this.params.amount * exchangeItem.amount > ep.count) throw new ErrorCode(4202, "ERROR_CODE_NOT_ENOUGH_EXCHANGE_POINT")

    const itemInfo = Item.nameToType(exchangeItem.item_name, exchangeItem.item_id)
    const reward = []

    if (itemInfo.itemType === 1001) {
      for (let i = 0; i < this.params.amount * exchangeItem.amount; i++) {
        await item.addPresent(this.user_id, {
          name: exchangeItem.item_name,
          id: exchangeItem.item_id
        }, "Exchange Reward", 1)
        reward.push({
          add_type: itemInfo.itemType,
          item_id: itemInfo.itemId,
          amount: 1,
          reward_box_flag: true,
          new_unit_flag: true
        })
      }
    } else {
      await new Item(this.connection).addPresent(this.user_id, {
        name: exchangeItem.item_name,
        id: exchangeItem.item_id
      }, "Exchange Reward", this.params.amount * exchangeItem.amount)
      reward.push({
        add_type: itemInfo.itemType,
        item_id: itemInfo.itemId,
        amount: this.params.amount * exchangeItem.amount,
        reward_box_flag: true,
        new_unit_flag: true
      })
    }

    await this.connection.execute("UPDATE user_exchange_point SET exchange_point = exchange_point - :val WHERE user_id = :user AND rarity = :rarity", {
      user: this.user_id,
      rarity: this.params.rarity,
      val: this.params.amount * exchangeItem.cost_value * exchangeItem.amount
    })
    await this.connection.execute("INSERT INTO exchange_log VALUES (:id, :user, val) ON DUPLICATE KEY UPDATE exchange_log SET got_item_count = got_item_count + :val", {
      id: exchangeItem.exchange_item_id,
      user: this.user_id,
      val: this.params.amount
    })

    return {
      status: 200,
      result: {
        exchange_reward: reward,
        before_user_info: beforeUserInfo,
        after_user_info: await user.getUserInfo(this.user_id),
        exchange_point_list: await this.connection.query("SELECT rarity, exchange_point FROM user_exchange_point WHERE user_id = :user", {
          user: this.user_id
        })
      }
    }
  }
}
