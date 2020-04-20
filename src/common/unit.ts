import { BaseAction } from "../models/actions"
import { Utils } from "./utils"
import { CommonModule } from "../models/common"
import { ErrorAPI } from "../models/error"

const unitDB = sqlite3.getUnitDB()
const exchangeDB = sqlite3.getExchangeDB()
const eventDB = sqlite3.getEventCommonDB()
const addUnitDefault = {
  level: 1,
  rank: 1,
  love: 0,
  useNumber: false,
  amount: 1
}
const updateAlbumDefault = {
  maxRank: false,
  maxLove: false,
  maxLevel: false,
  addLove: 0,
  addFavPt: 0
}

let supportUnitList: number[] = []
let removableSkillList: number[] = []
let noExchangePointList: number[] = []
let signUnitList: number[] = []
let eventUnitList: number[] = []
let attributeUnits: { [attribute: number]: number[] } = {}
let rarityUnits: { [rarity: number]: number[] } = {}
let supportUnitData: { [unitId: number]: supportUnitData } = {}

export async function init() {
  const supports = await unitDB.all(`
  SELECT
    name, unit_id, attribute_id, rarity, disable_rank_up, merge_exp, sale_price, merge_cost, grant_exp
  FROM
    unit_m
  LEFT JOIN unit_level_up_pattern_m
   ON unit_m.unit_level_up_pattern_id = unit_level_up_pattern_m.unit_level_up_pattern_id
  LEFT JOIN unit_skill_level_m
   ON unit_m.default_unit_skill_id = unit_skill_level_m.unit_skill_id
  WHERE disable_rank_up != 0`)
  supportUnitList = supports.map((unit: any) => {
    supportUnitData[unit.unit_id] = {
      name: unit.name,
      attribute: unit.attribute_id,
      rarity: unit.rarity,
      merge_cost: unit.merge_cost,
      sale_price: unit.sale_price,
      exp: unit.merge_exp,
      skill_exp: unit.grant_exp || 0
    }
    return unit.unit_id
  })

  noExchangePointList = (await exchangeDB.all("SELECT * FROM exchange_nopoint_unit_m")).map(unit => unit.unit_id)
  removableSkillList = (await unitDB.all("SELECT unit_removable_skill_id FROM unit_removable_skill_m")).map(skill => skill.unit_removable_skill_id)
  signUnitList = (await unitDB.all("SELECT * FROM unit_sign_asset_m")).map(unit => unit.unit_id)
  const epCountUnit = (await eventDB.all("SELECT item_id FROM event_point_count_reward_m WHERE add_type = 1001")).map(reward => reward.item_id)
  const epRankingUnit = (await eventDB.all("SELECT item_id FROM event_point_ranking_reward_m WHERE add_type = 1001")).map(reward => reward.item_id)
  eventUnitList = Utils.mergeArrayDedupe([epCountUnit, epRankingUnit])

  const allUnits = await unitDB.all("SELECT rarity, attribute_id, unit_id FROM unit_m")
  for (const unit of allUnits) {
    if (!attributeUnits[unit.attribute_id]) attributeUnits[unit.attribute_id] = []
    attributeUnits[unit.attribute_id].push(unit.unit_id)

    if (!rarityUnits[unit.rarity]) rarityUnits[unit.rarity] = []
    rarityUnits[unit.rarity].push(unit.unit_id)
  }
}

export class Unit extends CommonModule {
  public attributeUnits = attributeUnits
  public rarityUnits = rarityUnits
  constructor(action: BaseAction) {
    super(action)
  }

  public async addUnit(userId: number, unitId: number, options: Partial<typeof addUnitDefault> = {}): Promise<IAddUnitResult> {
    options = {
      ...addUnitDefault,
      ...options
    }
    if (options.useNumber) {
      const res = await unitDB.get(`SELECT unit_id FROM unit_m WHERE unit_number = :number`, { number: unitId })
      if (!res) throw new Error(`Unit Number "${unitId} does not exist`)
      unitId = res.unit_id
    }
    if (
      !(typeof userId === "number" &&
        typeof unitId === "number" &&
        userId >= 1 && unitId >= 1 &&
        typeof options.level === "number" &&
        typeof options.rank === "number" &&
        typeof options.love === "number" &&
        options.level >= 1 && options.rank >= 1 &&
        options.love >= 0)
    ) throw new Error("An invalid value was provided")

    if (supportUnitList.includes(unitId)) { // add support unit
      await this.connection.query(`INSERT INTO user_support_unit (user_id, unit_id, amount) VALUES (:user, :id, :amount) ON DUPLICATE KEY UPDATE amount=amount+:amount`, {
        user: userId,
        id: unitId,
        amount: options.amount
      })
      let isNewUnit = await this.updateAlbum(userId, unitId)
      let rarity = (await unitDB.get("SELECT rarity FROM unit_m WHERE unit_id=?", [unitId])).rarity
      return <any>{ // sorry :(
        unit_id: unitId,
        unit_owning_user_id: null,
        is_support_member: true,
        new_unit_flag: isNewUnit,
        unit_rarity_id: rarity,
        exp: 0,
        next_exp: 0,
        max_hp: 0,
        level: 1,
        skill_level: 1,
        rank: 1,
        love: 0,
        is_rank_max: true,
        is_level_max: true,
        is_love_max: true,
        unit_skill_exp: 0,
        display_rank: 1,
        unit_removable_skill_capacity: 0
      }
    } else {
      const unitData = await unitDB.get(`
      SELECT
        unit_id, attribute_id, disable_rank_up, after_love_max,
        before_love_max, after_level_max, before_level_max, default_unit_skill_id,
        max_removable_skill_capacity, default_removable_skill_capacity, unit_level_up_pattern_id,
        smile_max, pure_max, cool_max, hp_max, unit_skill_m.max_level as max_skill_level, rarity
      FROM
        unit_m
      LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id
      WHERE unit_id = :unit`, { unit: unitId })
      if (!unitData) throw new Error(`Unit Id "${unitId} does not exist`)
      const insertData: any = {
        user_id: userId,
        unit_id: null,
        exp: 0,
        next_exp: null,
        level: null,
        max_level: null,
        rank: null,
        max_rank: null,
        love: null,
        max_love: null,
        unit_skill_level: null,
        max_skill_level: null,
        max_hp: null,
        removable_skill_capacity: null,
        display_rank: null,
        stat_smile: null,
        stat_pure: null,
        stat_cool: null,
        attribute: null
      }
      insertData.unit_id = unitData.unit_id
      insertData.attribute = unitData.attribute_id
      insertData.max_rank = (unitData.disable_rank_up >= 1 ? 1 : 2)
      insertData.rank = Math.min(insertData.max_rank, options.rank)
      insertData.display_rank = insertData.rank
      insertData.max_skill_level = (unitData.max_skill_level == null ? 1 : unitData.max_skill_level)
      insertData.max_love = (insertData.rank == 2 ? unitData.after_love_max : unitData.before_love_max)
      insertData.max_level = (insertData.rabk == 2 ? unitData.after_level_max : unitData.before_level_max)
      insertData.level = Math.min(insertData.max_level, options.level)
      insertData.love = Math.min(insertData.max_love, options.love)
      insertData.unit_skill_level = 1
      insertData.removable_skill_capacity = Math.min(unitData.max_removable_skill_capacity, insertData.rank == insertData.max_rank ? (unitData.default_removable_skill_capacity + 1) : unitData.default_removable_skill_capacity)
      insertData.max_removable_skill_capacity = unitData.max_removable_skill_capacity

      const levels = await unitDB.all("SELECT * FROM unit_level_up_pattern_m WHERE unit_level_up_pattern_id = ? AND (unit_level IN (?,?))", [
        unitData.unit_level_up_pattern_id,
        insertData.level,
        insertData.level - 1
      ])

      for (const level of levels) {
        if (level.unit_level == insertData.level) {
          insertData.next_exp = level.next_exp
          insertData.stat_smile = unitData.smile_max - level.smile_diff
          insertData.stat_pure = unitData.pure_max - level.pure_diff
          insertData.stat_cool = unitData.cool_max - level.cool_diff
          insertData.max_hp = unitData.hp_max - level.hp_diff
        } else if (level.unit_level == (insertData.level - 1)) {
          insertData.exp = level.next_exp
        }
      }

      if (!options.amount) options.amount = 1 // fix complier error
      const addedIds = []
      let lastId = 0
      for (let i = 0; i < options.amount; i++) {
        const result = await this.connection.execute("\
        INSERT INTO units (\
          user_id, unit_id, `exp`, next_exp, `level`, max_level, `rank`, \
          max_rank, love, max_love, unit_skill_level, max_skill_level, max_hp, \
          removable_skill_capacity, max_removable_skill_capacity, display_rank, \
          stat_smile, stat_pure, stat_cool, attribute \
        ) VALUES (\
          :user_id, :unit_id, :exp, :next_exp, :level, :max_level, :rank, :max_rank, \
          :love, :max_love, :unit_skill_level, :max_skill_level, :max_hp, \
          :removable_skill_capacity, :max_removable_skill_capacity, :display_rank, \
          :stat_smile, :stat_pure, :stat_cool, :attribute \
        )", insertData)
        addedIds.push(result.insertId)
        lastId = result.insertId
      }

      const isMaxRank = (insertData.rank == insertData.max_rank)
      let isNewUnit = await this.updateAlbum(insertData.user_id, insertData.unit_id, {
        maxRank: isMaxRank,
        maxLove: insertData.love == insertData.max_love && isMaxRank,
        maxLevel: insertData.level == insertData.max_level && isMaxRank,
        addLove: insertData.love
      })

      const res = await this.getUnitDetail(lastId)
      return {
        unit_owning_ids: addedIds,
        new_unit_flag: isNewUnit,
        unit_rarity_id: unitData.rarity,
        ...(res)
      }
    }
  }

  /** Update information about unit in the album
   * @returns {true} if unit not exists in the album
   */
  public async updateAlbum(userId: number, unitId: number, options: Partial<typeof updateAlbumDefault> = {}): Promise<boolean> {
    options = {
      ...updateAlbumDefault,
      ...options
    }
    let data = await this.connection.first("SELECT * FROM user_unit_album WHERE user_id=:user AND unit_id=:unit", { user: userId, unit: unitId })
    if (!data) data = {}
    const values = {
      user: userId,
      unit: unitId,
      rank: options.maxRank || data.rank_max_flag ? 1 : 0,
      love: (options.maxRank || data.rank_max_flag) && (options.maxLove || data.love_max_flag) ? 1 : 0,
      level: (options.maxRank || data.rank_max_flag) && (options.maxLevel || data.rank_level_max_flag) ? 1 : 0,
      all: ((options.maxRank && options.maxLove && options.maxLevel) || (data.rank_max_flag && data.love_max_flag && data.rank_level_max_flag)) ? 1 : 0,
      lovemax: data.highest_love_per_unit ? Math.min(data.highest_love_per_unit + options.addLove, data.highest_love_per_unit) : options.addLove,
      lovetotal: options.addLove,
      fav: options.addFavPt
    }

    await this.connection.query(`
    INSERT INTO
      user_unit_album VALUES (:user, :unit, :rank, :love, :level, :all, :lovemax, :lovetotal, :fav)
    ON DUPLICATE KEY UPDATE
      rank_max_flag = :rank, love_max_flag = :love, rank_level_max_flag = :level,
      all_max_flag = :all, highest_love_per_unit = :lovemax, total_love = total_love + :lovetotal,
      favorite_point = favorite_point + :fav
    `, values)

    return Object.keys(data).length === 0
  }

  public async getUnitDetail(unitOwningUserId: number, userId?: number): Promise<detailUnitData> {
    let query = "SELECT * FROM units WHERE unit_owning_user_id = :uouid AND deleted = 0"
    if (userId) query = "SELECT * FROM units WHERE unit_owning_user_id = :uouid AND deleted = 0 AND user_id = :user"
    const data = await this.connection.first(query, {
      uouid: unitOwningUserId,
      user: userId
    })
    if (!data) throw new ErrorAPI(1311, "You don't have this card")

    data.removable_skill_ids = await this.getUnitSiS(unitOwningUserId)
    return {
      unit_owning_user_id: data.unit_owning_user_id,
      unit_id: data.unit_id,
      exp: data.exp,
      next_exp: data.next_exp,
      level: data.level,
      max_level: data.max_level,
      level_limit_id: 0,
      rank: data.rank,
      max_rank: data.max_rank,
      love: data.love,
      max_love: data.max_love,
      unit_skill_level: data.unit_skill_level,
      max_hp: data.max_hp,
      favorite_flag: !!data.favorite_flag,
      display_rank: data.display_rank,
      unit_skill_exp: data.unit_skill_exp,
      skill_level: data.unit_skill_level,
      unit_removable_skill_capacity: data.removable_skill_capacity,
      max_removable_skill_capacity: data.max_removable_skill_capacity, // server-side
      attribute: data.attribute,
      smile: data.stat_smile,
      cute: data.stat_pure,
      cool: data.stat_cool,
      is_rank_max: data.rank >= data.max_rank,
      is_love_max: data.love >= data.max_love && data.rank >= data.max_rank,
      is_level_max: data.level >= data.max_level && data.rank >= data.max_rank,
      is_skill_level_max: data.unit_skill_level >= data.max_skill_level,
      is_removable_skill_capacity_max: data.removable_skill_capacity >= data.max_removable_skill_capacity && data.rank >= data.max_rank,
      is_support_member: supportUnitList.includes(data.unit_id),
      removable_skill_ids: data.removable_skill_ids,
      insert_date: Utils.parseDate(data.insert_date),
      total_smile: data.stat_smile, // TODO?
      total_cute: data.stat_pure,
      total_cool: data.stat_cool,
      total_hp: data.max_hp
    }
  }

  public async getUnitSiS(unitOwningUserId: number): Promise<number[]> {
    const data = await this.connection.query(`
    SELECT unit_removable_skill_id
    FROM user_unit_removable_skill_equip
    WHERE unit_owning_user_id = :id`, { id: unitOwningUserId })
    if (!data) throw new Error(`Data for uouid is missing`)

    return data.map((val: any) => val.unit_removable_skill_id)
  }

  public async getNotLockedUnits(userId: number, units: number[]) {
    if (units.length === 0) units.push(0)
    return await this.connection.query(`
    SELECT
      units.unit_owning_user_id AS unit_owning_user_id,
      units.user_id AS user_id,
      units.level AS level,
      units.unit_id AS unit_id,
      units.unit_skill_level AS unit_skill_level
    FROM
      units
    WHERE
    units.unit_owning_user_id NOT IN (
      SELECT
        unit_owning_user_id
      FROM
        user_unit_deck_slot
      JOIN users
        ON users.user_id = user_unit_deck_slot.user_id
        AND users.main_deck = user_unit_deck_slot.deck_id
    )
    AND units.unit_owning_user_id NOT IN (
      SELECT
        partner_unit
      FROM
        users
      WHERE users.user_id = units.user_id
    )
    AND units.favorite_flag = 0
    AND units.deleted = 0
    AND units.unit_owning_user_id IN (${units.join(",")}) AND user_id = :user`, {
      user: userId
    })
  }

  public isSignUnit(unitId: number) {
    return signUnitList.includes(unitId)
  }

  public getSupportUnitList() {
    return supportUnitList
  }
  public getSupportUnitData() {
    return supportUnitData
  }
  public getNoExchangePointList() {
    return noExchangePointList
  }
  public getRemovableSkillIds() {
    return removableSkillList
  }
  public getEventUnitList() {
    return eventUnitList
  }
}
