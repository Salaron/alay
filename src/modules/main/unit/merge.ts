import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import assert from "assert"
import { User } from "../../../common/user"
import { Unit } from "../../../common/unit"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"

const unitDB = sqlite3.getUnit()

export default class extends MainAction {
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
      typeof this.params.unit_support_list === "object" && Array.isArray(this.params.unit_support_list)
      , "Invalid params")
    if (
      this.params.unit_owning_user_ids.length > 12 ||
      this.params.unit_support_list.length > 12
    ) throw new Error(`Too more...`)
  }

  public async execute() {
    const user = new User(this.connection)
    const unit = new Unit(this.connection)
    const supportUnitData = Unit.getSupportUnitData()
    const noExchangePointList = Unit.getNoExchangePointList()

    const _owningSupportUnit = await user.getSupportUnits(this.user_id) // tslint:disable-line
    const owningSupportUnit = <{ [id: number]: number }>{}
    for (const support of _owningSupportUnit) owningSupportUnit[support.unit_id] = support.amount

    let cardsCount = 0
    for (const id of this.params.unit_owning_user_ids) {
      assert(Type.isInt(id) && id > 0, "uouid should be int")
      cardsCount++
    }
    for (const support of this.params.unit_support_list) {
      assert(typeof support === "object", "support is not an object")
      assert(Type.isInt(support.amount) && support.amount > 0, "amount should be int")
      assert(Type.isInt(support.unit_id), "unit_id should be int")
      assert(Unit.getSupportUnitList().includes(support.unit_id), "This is not support unit")
      assert(owningSupportUnit[support.unit_id] && owningSupportUnit[support.unit_id] >= support.amount, "Not enought supports")

      cardsCount += support.amount
    }

    if (cardsCount < 1 || cardsCount > 12) throw new Error(`Invalid number of sacrifice cards`)

    const baseUnitData = await this.connection.first("SELECT * FROM units WHERE unit_owning_user_id=:unit AND user_id=:user AND deleted=0", {
      user: this.user_id,
      unit: this.params.base_owning_unit_user_id
    })
    if (baseUnitData.length === 0) throw new ErrorCode(1311) // ERROR_CODE_UNIT_NOT_EXIST
    if (
      baseUnitData.level >= baseUnitData.max_level && baseUnitData.unit_skill_level >= baseUnitData.max_skill_level
    ) throw new ErrorCode(1313, "ERROR_CODE_UNIT_LEVEL_AND_SKILL_LEVEL_MAX")
    const baseUnitDataDef = await unitDB.get("SELECT * FROM unit_m WHERE unit_id = :id", {
      id: baseUnitData.unit_id
    })
    if (!baseUnitDataDef) throw new Error(`Failed to find info (unit_id ${baseUnitData.unit_id})`)
    baseUnitData.default_unit_skill_id = baseUnitDataDef.default_unit_skill_id
    baseUnitData.unit_level_up_pattern_id = baseUnitDataDef.unit_level_up_pattern_id
    const beforeUserInfo = await user.getUserInfo(this.user_id)
    const beforeUnitInfo = await unit.getUnitDetail(baseUnitData.unit_owning_user_id)

    let expMultiplier = 1
    let gainExp = 0
    let gainSkillExp = 0
    let coinCost = 0
    const seals: any = {
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
    const rndNumber = Utils.getRandomNumber(1, 100)
    if (rndNumber === 1) {
      expMultiplier = 2
    } else if (rndNumber % 10 === 0) {
      expMultiplier = 1.5
    }

    for (const support of this.params.unit_support_list) {
      const attrMatch = (
        supportUnitData[support.unit_id].attribute == 5 ||
        supportUnitData[support.unit_id].attribute == baseUnitData.attribute
      )
      gainExp += (supportUnitData[support.unit_id].exp * support.amount) * (attrMatch ? 1.2 : 1)
      gainSkillExp += (supportUnitData[support.unit_id].skill_exp * support.amount) * (attrMatch ? 1 : 0)
      coinCost += supportUnitData[support.unit_id].merge_cost * support.amount
      await this.connection.query("UPDATE user_support_unit SET amount = amount - :amount WHERE unit_id = :unit AND user_id = :user", {
        amount: support.amount,
        unit: support.unit_id,
        user: this.user_id
      })
    }

    if (this.params.unit_owning_user_ids.length > 0) {
      const unitData = await this.connection.query(`SELECT * FROM v_units_not_locked WHERE user_id=:user AND unit_owning_user_id IN (${this.params.unit_owning_user_ids.join(",")})`, {
        user: this.user_id
      })
      if (unitData.length != this.params.unit_owning_user_ids.length) throw new ErrorCode(1311)

      await unitData.forEachAsync(async (unit: any) => {
        if (unit.unit_owning_user_id === this.params.base_owning_unit_user_id) throw new Error("Nice try :)")
        const data = await unitDB.get(`
        SELECT
          merge_cost, merge_exp, default_unit_skill_id, sl.grant_exp as grant_skill_exp, attribute_id, rarity
        FROM
          unit_m as u
        JOIN unit_level_up_pattern_m as l
          ON u.unit_level_up_pattern_id=l.unit_level_up_pattern_id
        LEFT JOIN unit_skill_m as s
          ON u.default_unit_skill_id = s.unit_skill_id
        LEFT JOIN unit_skill_level_m as sl
          ON s.unit_skill_id = sl.unit_skill_id
        WHERE unit_id = :id AND unit_level = :level AND (skill_level = :skill OR skill_level IS NULL)`
        , { id: unit.unit_id, level: unit.level, skill: unit.unit_skill_level })
        if (!data) throw new Error(`Failed to find info (unit_id ${unit.unit_id})`)

        gainExp += data.merge_exp * (data.attribute_id == baseUnitData.attribute ? 1.2 : 1)
        coinCost += data.merge_cost

        if (
          data.default_unit_skill_id &&
          data.default_unit_skill_id === baseUnitData.default_unit_skill_id
        ) gainSkillExp += data.grant_skill_exp
        if ((!noExchangePointList.includes(unit.unit_id)) && seals[data.rarity] != null) {
          seals[data.rarity] += 1
        }
      })

      if (Config.modules.unit.removeFromDatabase === true) {
        await this.connection.query(`DELETE FROM units WHERE unit_owning_user_id IN (:units) AND user_id = :user`, {
          units: this.params.unit_owning_user_ids,
          user: this.user_id
        })
      } else {
        await this.connection.query(`UPDATE units SET deleted = 1 WHERE unit_owning_user_id IN (:units) AND user_id = :user`, {
          units: this.params.unit_owning_user_ids,
          user: this.user_id
        })
      }
    }
    if (beforeUserInfo.game_coin < coinCost) throw new ErrorCode(1104, "ERROR_CODE_NOT_ENOUGH_GAME_COIN")

    const newExp = baseUnitData.exp + (gainExp * expMultiplier)
    const newSkillExp = baseUnitData.default_unit_skill_id ? (baseUnitData.unit_skill_exp + gainSkillExp) : 0
    let newLevel = baseUnitData.level
    let newLevelData: any = null
    let newSkillLevel = baseUnitData.unit_skill_level
    let newSkillData: any = null

    // some recursion funcs
    const levelUp = async () => {
      if (newLevel >= baseUnitData.max_level) return
      newLevelData = await unitDB.get(`
      SELECT next_exp, hp_diff, smile_diff, pure_diff, cool_diff
      FROM unit_level_up_pattern_m
      WHERE unit_level_up_pattern_id = :pattern AND unit_level = :level`, { pattern: baseUnitData.unit_level_up_pattern_id, level: newLevel })
      if (newExp >= newLevelData.next_exp) {
        newLevel += 1
        await levelUp()
      }
    }
    const skillLevelUp = async () => {
      if (newSkillLevel >= baseUnitData.max_skill_level) return
      newSkillData = await unitDB.get(`
      SELECT next_exp
      FROM unit_skill_level_up_pattern_m
      JOIN unit_skill_m
        ON unit_skill_m.unit_skill_level_up_pattern_id = unit_skill_level_up_pattern_m.unit_skill_level_up_pattern_id
      WHERE unit_skill_id = :skill AND skill_level = :level`, { skill: baseUnitData.default_unit_skill_id, level: newSkillLevel })
      if (!newSkillData) return
      if (newSkillExp >= newSkillData.next_exp) {
        newSkillLevel += 1
        await skillLevelUp()
      }
    }

    await Promise.all([
      levelUp(),
      skillLevelUp()
    ])

    const newData = {
      unit: baseUnitData.unit_owning_user_id,
      hp: newLevel >= baseUnitData.max_level ? baseUnitDataDef.hp_max : baseUnitDataDef.hp_max - newLevelData.hp_diff,
      smile: newLevel >= baseUnitData.max_level ? baseUnitDataDef.smile_max : baseUnitDataDef.smile_max - newLevelData.smile_diff,
      pure: newLevel >= baseUnitData.max_level ? baseUnitDataDef.pure_max : baseUnitDataDef.pure_max - newLevelData.pure_diff,
      cool: newLevel >= baseUnitData.max_level ? baseUnitDataDef.cool_max : baseUnitDataDef.cool_max - newLevelData.cool_diff,
      level: newLevel,
      exp: newExp,
      nextexp: baseUnitData.next_exp,
      skilllevel: newSkillLevel,
      skillexp: newSkillExp
    }

    const isMaxRank = baseUnitData.rank >= baseUnitData.max_rank
    await Promise.all([
      this.connection.query(`
      UPDATE
        units
      SET
        max_hp = :hp, stat_smile = :smile, stat_pure = :pure, stat_cool = :cool, level = :level,
        exp = :exp, next_exp = :nextexp, unit_skill_level = :skilllevel, unit_skill_exp = :skillexp
      WHERE unit_owning_user_id = :unit`, newData),
      this.connection.query("UPDATE users SET game_coin=game_coin - :cost WHERE user_id = :user", {
        user: this.user_id,
        cost: coinCost
      }),
      unit.updateAlbum(this.user_id, baseUnitData.unit_id, {
        maxRank: isMaxRank,
        maxLove: (baseUnitData.love == baseUnitData.max_love && isMaxRank),
        maxLevel: (newData.level == baseUnitData.max_level && isMaxRank)
      }),
      this.connection.query("INSERT INTO user_exchange_point VALUES (:user,2,:s2),(:user,3,:s3),(:user,4,:s4),(:user,5,:s5) ON DUPLICATE KEY UPDATE exchange_point=exchange_point+VALUES(exchange_point);", {
        user: this.user_id,
        s2: seals[2],
        s3: seals[3],
        s4: seals[4],
        s5: seals[5]
      })
    ])

    const afterUserInfo = await user.getUserInfo(this.user_id)
    const pointList = <any>[]
    for (const rarity of Object.keys(seals)) {
      if (seals[rarity] > 0) pointList.push({
        rarity,
        exchange_point: seals[rarity]
      })
    }
    return {
      status: 200,
      result: {
        before_user_info: beforeUserInfo,
        after_user_info: afterUserInfo,
        before: beforeUnitInfo,
        after: await unit.getUnitDetail(baseUnitData.unit_owning_user_id),
        user_game_coin: coinCost,
        evolution_setting_id: expMultiplier == 2 ? 3 : (expMultiplier == 1.5 ? 2 : 1),
        bonus_value: expMultiplier,
        open_subscenario_id: null,
        get_exchange_point_list: pointList,
        unit_removable_skill: await user.getRemovableSkillInfo(this.user_id)
      }
    }
  }
}
