import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

const unitDB = sqlite3.getUnitDB()
const itemDB = sqlite3.getItemDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      item_id: TYPE.INT,
      count: TYPE.INT,
      unit_owning_user_id: TYPE.INT
    }
  }

  public async execute() {
    const unitInfo = await this.unit.getUnitDetail(this.params.unit_owning_user_id)
    const [beforeUserInfo, enhanceItem, unitRarity] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      itemDB.get("SELECT * FROM unit_enhance_item_m WHERE item_id = :itemId", { itemId: this.params.item_id }),
      unitDB.get("SELECT rarity FROM unit_m WHERE unit_id = :unitId", { unitId: unitInfo.unit_id })
    ])
    if (!enhanceItem)
      throw new ErrorAPI("Unknown itemId")
    if (
      (enhanceItem.unit_id && enhanceItem.unit_id !== unitInfo.unit_id) ||
      (enhanceItem.rarity && enhanceItem.rarity !== unitRarity.rarity)
    ) throw new ErrorAPI("Item cannot be used for this unit")

    // TODO: for what weight is used?
    const levelLimit = await unitDB.get("SELECT * FROM unit_level_limit_m WHERE unit_level_limit_group_id = :rarity", {
      rarity: unitRarity.rarity
    })
    if (!levelLimit) throw new ErrorAPI("limit level data is missing")
    const levelUpCount = this.params.count / enhanceItem.enhance_count

    // TODO:
    // get user items
    // substract it

    unitInfo.max_level = unitInfo.max_level + levelUpCount
    await this.connection.execute("UPDATE units SET max_level = :level WHERE unit_owning_user_id = :uouid AND user_id = :user", {
      uouid: unitInfo.unit_owning_user_id,
      user: this.user_id
    })
    const afterUserInfo = await this.user.getUserInfo(this.user_id)
    return {
      status: 200,
      result: {
        before: unitInfo,
        after: unitInfo,
        before_user_info: beforeUserInfo,
        after_user_info: afterUserInfo
      }
    }
  }
}
