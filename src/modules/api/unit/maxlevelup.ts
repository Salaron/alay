// preview version
// this feature not released yet on the official server (13.04.2020)
import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

const unitDB = sqlite3.getUnitDB()
const itemDB = sqlite3.getItemDB()

interface detailUnitDataWithRarity extends detailUnitData {
  rarity?: number
}
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
    const before: detailUnitDataWithRarity = await this.unit.getUnitDetail(this.params.unit_owning_user_id)
    const item = await itemDB.get("SELECT * FROM unit_enhance_item_m WHERE item_id = :itemId", { itemId: this.params.item_id })
    before.rarity = await unitDB.get("SELECT rarity FROM unit_m WHERE unit_id = :unitId", { unitId: before.unit_id })
    if (!item) throw new ErrorAPI("Unknown itemId")
    if (item.unit_id && (item.unit_id !== before.unit_id || item.rarity !== before.rarity))
      throw new ErrorAPI("This item cannot be used for this unit")

    // TODO: for what weight is used?
    const levelLimit = await unitDB.get("SELECT * FROM unit_level_limit_m WHERE unit_level_limit_group_id = :rarity", {
      rarity: before.rarity
    })
    if (!levelLimit) throw new ErrorAPI("limit level data is missing")

    // get user items
    // substract it

    const limitLevelPattern = await unitDB.all("SELECT * FROM unit_level_limit_pattern_m WHERE unit_level_limit_id = :id", {
      id: levelLimit.unit_level_limit_id
    })
    const levelUpCount = this.params.count / item.enhance_amount
    const diff = {
      max_level: 0,
      hp: 0,
      smile: 0,
      pure: 0,
      cool: 0,
    }
    let levelProceed = 0
    for (const pattern of limitLevelPattern) {
      if (before.max_level >= pattern.unit_level) continue
      if (levelProceed === levelUpCount) break
      diff.hp += pattern.hp_diff
      diff.smile += pattern.smile_diff
      diff.pure += pattern.pure_diff
      diff.cool += pattern.cool_diff
      diff.max_level = pattern.unit_level
      levelProceed += 1
    }

    await this.connection.execute(`
    UPDATE units
    SET
      max_level = :level, hp = hp + :hp, stat_smile = stat_smile + :smile,
      stat_pure = stat_pure + :pure, stat_cool = stat_cool + :cool
    WHERE
      unit_owning_user_id = :uouid AND user_id = :userId`, {
      uouid: before.unit_owning_user_id,
      userId: this.user_id,
      ...diff
    })

    const after = await this.unit.getUnitDetail(this.params.unit_owning_user_id)
    return {
      status: 200,
      result: {
        before,
        after
        // item info?
      }
    }
  }
}
