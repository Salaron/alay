import assert from "assert"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const unitDB = sqlite3.getUnitDB()

const rankUpCost = <any>{ // cost[RARITY][POINT_ID]
  2: [null, null,   1, null, null, null], // R sticker. Only R cards
  3: [null, null,  20,    1, null, null], // SR sticker. R and SR cards
  4: [null, null, 500,   15,    1,    5], // UR sticker. R, SR, SSR, UR cards
  5: [null, null, 100,    5, null,    1]  // SSR sticer. R, SR, SSR
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
      base_owning_unit_user_id: TYPE.INT,
      exchange_point_id: TYPE.INT
    }
  }

  public paramCheck() {
    assert(this.params.exchange_point_id >= 2 && this.params.exchange_point_id <= 5, "Invalid params")
  }

  public async execute() {
    const baseUnit = await this.unit.getUnitDetail(this.params.base_owning_unit_user_id, this.user_id)
    if (baseUnit.rank >= baseUnit.max_rank && baseUnit.is_removable_skill_capacity_max) throw new ErrorAPI(1313, "ERROR_CODE_UNIT_LEVEL_AND_SKILL_LEVEL_MAX")

    const baseUnitData = await unitDB.get(`
    SELECT
      exchange_point_rank_up_cost, disable_rank_up, after_love_max, after_level_max, unit_m.rarity
    FROM
      unit_m
    LEFT JOIN unit_rarity_m ON unit_m.rarity = unit_rarity_m.rarity
    WHERE unit_id = :id`, {
      id: baseUnit.unit_id
    })
    assert(baseUnitData, `Failed to find unit data [${baseUnit.unit_id}]`)
    assert(baseUnitData.disable_rank_up === 0, "This unit can't be ranked up")

    const beforeUserInfo = await this.user.getUserInfo(this.user_id)
    const ePoints = await this.connection.first("SELECT exchange_point FROM user_exchange_point WHERE user_id=:user AND rarity=:rarity", {
      user: this.user_id,
      rarity: this.params.exchange_point_id
    })
    if (
      !rankUpCost[baseUnitData.rarity] ||
      !rankUpCost[baseUnitData.rarity][this.params.exchange_point_id] ||
      ePoints.exchange_point < rankUpCost[baseUnitData.rarity][this.params.exchange_point_id]
    ) throw new ErrorAPI(4202, "ERROR_CODE_NOT_ENOUGH_EXCHANGE_POINT")
    if (beforeUserInfo.game_coin < baseUnitData.exchange_point_rank_up_cost) throw new ErrorAPI(1104, "ERROR_CODE_NOT_ENOUGH_GAME_COIN")

    let gainSlots = 0 // slots will be gained only after idolize
    if (baseUnit.rank === baseUnit.max_rank) gainSlots += 1

    await Promise.all([
      this.connection.query(`
      UPDATE units
      SET
      \`rank\` = max_rank, display_rank = max_rank, removable_skill_capacity = :skillcap,
      max_love = :maxlove, max_level = :maxlevel WHERE unit_owning_user_id = :unit`, {
        unit: baseUnit.unit_owning_user_id,
        skillcap: Math.min(baseUnit.max_removable_skill_capacity, baseUnit.unit_removable_skill_capacity + gainSlots),
        maxlove: baseUnitData.after_love_max,
        maxlevel: baseUnitData.after_level_max
      }),
      this.connection.query("UPDATE user_exchange_point SET exchange_point=exchange_point-:amount WHERE user_id=:user AND rarity=:rarity", {
        user: this.user_id,
        rarity: this.params.exchange_point_id,
        amount: rankUpCost[baseUnitData.rarity][this.params.exchange_point_id]
      }),
      this.connection.query("UPDATE users SET game_coin = game_coin - :cost WHERE user_id = :user", {
        cost: baseUnitData.exchange_point_rank_up_cost,
        user: this.user_id
      }),
      this.unit.updateAlbum(this.user_id, baseUnit.unit_id, {
        maxRank: true
      })
    ])

    const [afterUserInfo, afterUnitInfo, removableSkillInfo] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.unit.getUnitDetail(this.params.base_owning_unit_user_id, this.user_id),
      this.user.getRemovableSkillInfo(this.user_id)
    ])

    return {
      status: 200,
      result: {
        before: baseUnit,
        after: afterUnitInfo,
        before_user_info: beforeUserInfo,
        after_user_info: afterUserInfo,
        use_game_coin: baseUnitData.exchange_point_rank_up_cost,
        after_exchange_point: ePoints.exchange_point - rankUpCost[baseUnitData.rarity][this.params.exchange_point_id],
        unit_removable_skill: removableSkillInfo
      }
    }
  }
}
