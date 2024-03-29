import assert from "assert"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const unitDB = sqlite3.getUnitDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      base_owning_unit_user_id: TYPE.INT
    }
  }

  public paramCheck() {
    assert(
      typeof this.params.unit_owning_user_ids === "object" && Array.isArray(this.params.unit_owning_user_ids) &&
      this.params.unit_owning_user_ids.length === 1 && Type.isInt(this.params.unit_owning_user_ids[0]) &&
      this.params.base_owning_unit_user_id != this.params.unit_owning_user_ids[0]
      , "Invalid params")
  }

  public async execute() {
    const sacrificeUnit = await this.unit.getNotLockedUnits(this.user_id, [this.params.unit_owning_user_ids[0]])
    if (sacrificeUnit.length === 0) throw new ErrorAPI(1311)

    const baseUnit = await this.unit.getUnitDetail(this.params.base_owning_unit_user_id, this.user_id)
    if (sacrificeUnit[0].unit_id != baseUnit.unit_id) throw new Error("Not Same Unit")
    if (baseUnit.rank >= baseUnit.max_rank && baseUnit.is_removable_skill_capacity_max) throw new ErrorAPI(1313, "ERROR_CODE_UNIT_LEVEL_AND_SKILL_LEVEL_MAX")

    const baseUnitData = await unitDB.get("SELECT rank_up_cost, disable_rank_up, after_love_max, after_level_max FROM unit_m WHERE unit_id = :id", {
      id: baseUnit.unit_id
    })
    assert(baseUnitData, `Failed to find unit data [${baseUnit.unit_id}]`)
    assert(baseUnitData.disable_rank_up === 0, "This unit can't be ranked up")

    const beforeUserInfo = await this.user.getUserInfo(this.user_id)
    if (beforeUserInfo.game_coin < baseUnitData.rank_up_cost) throw new ErrorAPI(1104, "ERROR_CODE_NOT_ENOUGH_GAME_COIN")

    let gainSlots = 1
    if (baseUnit.rank === baseUnit.max_rank) gainSlots += 1

    await this.connection.query(`
    UPDATE units
    SET
    \`rank\` = max_rank, display_rank = max_rank, removable_skill_capacity = :skillcap,
    max_love = :maxlove, max_level = :maxlevel WHERE unit_owning_user_id = :unit`, {
      unit: baseUnit.unit_owning_user_id,
      skillcap: Math.min(baseUnit.max_removable_skill_capacity, baseUnit.unit_removable_skill_capacity + gainSlots),
      maxlove: baseUnitData.after_love_max,
      maxlevel: baseUnitData.after_level_max
    })

    let query = "DELETE FROM units WHERE unit_owning_user_id = :unit"
    if (Config.modules.unit.removeFromDatabase === false) {
      query = "UPDATE units SET deleted = 1 WHERE unit_owning_user_id = :unit"
    }

    await Promise.all([
      this.connection.query(query, {
        unit: sacrificeUnit[0].unit_owning_user_id
      }),
      this.connection.query("UPDATE users SET game_coin = game_coin - :cost WHERE user_id = :user", {
        cost: baseUnitData.rank_up_cost,
        user: this.user_id
      }),
      this.unit.updateAlbum(this.user_id, baseUnit.unit_id, {
        maxRank: true
      })
    ])

    const [afterUserInfo, afterUnitInfo, removableSkillInfo] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.unit.getUnitDetail(this.params.base_owning_unit_user_id, this.user_id),
      this.user.getRemovableSkillInfo(this.user_id, true)
    ])

    return {
      status: 200,
      result: {
        before: baseUnit,
        after: afterUnitInfo,
        before_user_info: beforeUserInfo,
        after_user_info: afterUserInfo,
        use_game_coin: baseUnitData.rank_up_cost,
        open_subscenario_id: null,
        get_exchange_point_list: [],
        unit_removable_skill: removableSkillInfo
      }
    }
  }
}
