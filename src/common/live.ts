import { Log } from "../core/log"
import extend from "extend"

const log = new Log("Common: Live")

const liveDB = sqlite3.getLive()
const liveNotesDB = sqlite3.getNotes()
const festDB = sqlite3.getFestival()
const marathonDB = sqlite3.getMarathon()
const unitDB = sqlite3.getUnit()

const expTable = [0, 12, 26, 46, 65, 71, 84]
let availableLiveList: number[] = []
let normalLiveList: number[] = []
let specialLiveList: number[] = []
let marathonLiveList: { [eventId: number]: number[] } = {}
export async function init() {
  let liveSettings = await liveNotesDB.all("SELECT DISTINCT live_setting_id FROM live_note")
  for (let i = 0; i < liveSettings.length; i++) {
    availableLiveList.push(liveSettings[i].live_setting_id)
  }
  log.info(`Found note data for ${availableLiveList.length} lives`)

  let normal = await liveDB.all("SELECT live_difficulty_id, live_setting_id FROM normal_live_m")
  for (let i = 0; i < normal.length; i++) {
    if (availableLiveList.includes(normal[i].live_setting_id)) {
      normalLiveList.push(normal[i].live_difficulty_id)
    } else {
      log.verbose(`Missing Note Data for Normal Live #${normal[i].live_difficulty_id} (Setting #${normal[i].live_setting_id})`)
    }
  }
  log.info(`Found data for ${normalLiveList.length} normal lives`)

  let special = await liveDB.all("SELECT live_difficulty_id, live_setting_id FROM special_live_m")
  for (let i = 0; i < special.length; i++) {
    if (availableLiveList.includes(special[i].live_setting_id)) {
      specialLiveList.push(special[i].live_difficulty_id)
    } else {
      log.verbose(`Missing Note Data for Special Live #${special[i].live_difficulty_id} (Setting #${special[i].live_setting_id})`)
    }
  }
  log.info(`Found data for ${specialLiveList.length} special lives`)

  let marathon = await marathonDB.all(`
  SELECT 
    event_id, live.live_difficulty_id, live_setting_id 
  FROM 
    event_marathon_live_m as live 
  JOIN event_marathon_live_schedule_m as schedule 
    ON schedule.live_difficulty_id = live.live_difficulty_id`)
  for (const live of marathon) {
    if (availableLiveList.includes(live.live_setting_id)) {
      if (!marathonLiveList[live.event_id]) marathonLiveList[live.event_id] = []
      marathonLiveList[live.event_id].push(live.live_difficulty_id)
    } else {
      log.verbose(`Missing Note Data for Marathon Live #${live.live_difficulty_id} (Setting #${live.live_setting_id})`)
    }
  }
}

export class Live {
  connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async getLiveNotes(userId: number, liveSettingId: number, isEvent = false) {
    let params = await new User(this.connection).getParams(userId)
    let vanish = 0

    // make mirror on-the-fly 
    let mirror = 0
    if ((isEvent === true && params.event === 1) || isEvent === false) {
      vanish = params.vanish ? params.vanish : 0
      mirror = params.mirror === 1 ? 10 : 0
    }

    let notes = await liveNotesDB.all(`
    SELECT 
      timing_sec, notes_attribute, notes_level, effect, 
      effect_value, (abs(${mirror} - position)) as position, 
      ${vanish} as vanish 
    FROM live_note 
    WHERE live_setting_id = :id`, { id: liveSettingId })
    if (notes.length === 0) throw new Error(`Live notes data for LSID #${liveSettingId} is missing in database`)

    return notes
  }

  // only for special, normal lives or marathon lives not other
  public async getLiveDataByDifficultyId(liveDifficultyId: number): Promise<liveData> {
    let data = await liveDB.get(`
    SELECT 
      c_rank_score, b_rank_score, a_rank_score, s_rank_score, 
      c_rank_combo, b_rank_combo, a_rank_combo, s_rank_combo, 
      c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete, 
      difficulty, ac_flag, swing_flag, setting.live_setting_id, difficulty.live_difficulty_id,
      capital_type, capital_value
    FROM live_setting_m as setting INNER JOIN (
      SELECT 
        live_setting_id, live_difficulty_id, capital_type, capital_value,
        c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
      FROM special_live_m 
      UNION 
      SELECT 
        live_setting_id, live_difficulty_id, capital_type, capital_value,
        c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete 
      FROM normal_live_m
    ) as difficulty ON setting.live_setting_id = difficulty.live_setting_id 
    WHERE live_difficulty_id = :ldid`, { ldid: liveDifficultyId })
    if (!data) {
      // Token live?
      data = {
        marathon_live: true
      }
      let tokenData = await marathonDB.get(`
      SELECT 
        live_difficulty_id, live_setting_id, capital_type, capital_value, random_flag,
        c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
      FROM event_marathon_live_m
      WHERE live_difficulty_id = :ldid`, { ldid: liveDifficultyId })
      if (!tokenData) throw new Error(`Live data for live difficulty id #${liveDifficultyId} is missing`)
      let settingData = await liveDB.get(`
      SELECT 
        c_rank_score, b_rank_score, a_rank_score, s_rank_score, 
        c_rank_combo, b_rank_combo, a_rank_combo, s_rank_combo, 
        difficulty, ac_flag, swing_flag, live_setting_id
      FROM live_setting_m a WHERE live_setting_id = :lsid`, { lsid: tokenData.live_setting_id })
      if (!settingData) throw new Error(`Live data for live setting id #${tokenData.live_setting_id} is missing`)
      extend(true, data, tokenData, settingData)
    }
    if (!data.random_flag) data.random_flag = 0
    if (!data.marathon_live) data.marathon_live = false
    data.score_rank_info = [
      { rank: 5, rank_min: 0, rank_max: data.c_rank_score - 1 },
      { rank: 4, rank_min: data.c_rank_score, rank_max: data.b_rank_score - 1 },
      { rank: 3, rank_min: data.b_rank_score, rank_max: data.a_rank_score - 1 },
      { rank: 2, rank_min: data.a_rank_score, rank_max: data.s_rank_score - 1 },
      { rank: 1, rank_min: data.s_rank_score, rank_max: 0 }
    ]
    data.combo_rank_info = [
      { rank: 5, rank_min: 0, rank_max: data.c_rank_combo - 1 },
      { rank: 4, rank_min: data.c_rank_combo, rank_max: data.b_rank_combo - 1 },
      { rank: 3, rank_min: data.b_rank_combo, rank_max: data.a_rank_combo - 1 },
      { rank: 2, rank_min: data.a_rank_combo, rank_max: data.s_rank_combo - 1 },
      { rank: 1, rank_min: data.s_rank_combo, rank_max: 0 }
    ]
    data.complete_rank_info = [
      { rank: 5, rank_min: 0, rank_max: data.c_rank_complete - 1 },
      { rank: 4, rank_min: data.c_rank_complete, rank_max: data.b_rank_complete - 1 },
      { rank: 3, rank_min: data.b_rank_complete, rank_max: data.a_rank_complete - 1 },
      { rank: 2, rank_min: data.a_rank_complete, rank_max: data.s_rank_complete - 1 },
      { rank: 1, rank_min: data.s_rank_complete, rank_max: 0 }
    ]
    return data
  }

  public async getUserDeck(userId: number, deckId: number, calculateScore = true, guestUnitId?: number, includeDeckData?: boolean, cleanup = true) {
    let deck = await this.connection.query(`
    SELECT
      max_removable_skill_capacity, units.unit_owning_user_id, slot_id, unit_id,
      stat_smile, stat_pure, stat_cool, max_hp, attribute, love, level, unit_skill_level, 
      max_love, 'rank', max_rank, max_level, max_skill_level
    FROM user_unit_deck_slot 
    JOIN units
      ON units.unit_owning_user_id = user_unit_deck_slot.unit_owning_user_id
    WHERE user_unit_deck_slot.user_id = :user AND deck_id = :deck`, { user: userId, deck: deckId })
    if (deck.length === 0) throw new Error(`Deck doesn't exists`)
    deck = deck.map(unit => {
      return {
        unit_owning_user_id: unit.unit_owning_user_id,
        unit_id: unit.unit_id,
        position: unit.slot_id,
        level: unit.level,
        unit_skill_level: unit.unit_skill_level,
        before_love: unit.love,
        love: unit.love,
        max_love: unit.max_love,
        max_skill_level: unit.max_skill_level,
        max_hp: unit.max_hp,
        unit_removable_skill_capacity: unit.max_removable_skill_capacity,
        stat_smile: unit.stat_smile,
        stat_pure: unit.stat_pure,
        stat_cool: unit.stat_cool,
        attribute: unit.attribute,
        rank: unit.rank,
        is_rank_max: unit.rank >= unit.max_rank,
        is_love_max: unit.love >= unit.max_love,
        is_level_max: unit.level >= unit.max_level,
        is_skill_level_max: unit.unit_skill_level >= unit.max_skill_level
      }
    })

    if (calculateScore) {
      await this.calculateScoreBonus(userId, deck, guestUnitId, cleanup)
    }

    let units = []
    let smile = 0
    let pure = 0
    let cool = 0
    let hp = 0
    for (const unit of deck) {
      units.push({
        smile: unit.stat_smile,
        cute: unit.stat_pure,
        cool: unit.stat_cool
      })
      smile += unit.stat_smile
      pure += unit.stat_pure
      cool += unit.stat_cool
      hp += unit.max_hp
    }

    return {
      unit_deck_id: deckId,
      total_smile: smile,
      total_cute: pure,
      total_cool: cool,
      total_hp: hp,
      unit_list: units,
      deck: includeDeckData ? deck : undefined
    }
  }

  public async calculateScoreBonus(userId: number, deck: any[], guestUnitId?: number, cleanup = true) {
    // 1. Apply love (kizuna) bonus
    // 2. Apply SIS bonus 
    // 3. Calculate Center and Extra bonus of center unit
    // 4. Caclulate Center and Extra bonus of guest if exists
    // 5. Apply Center and Extra bonus

    // Some temporary fields
    // will be removed if cleanup flag is true
    for (const unit of deck) {
      if (unit.attribute === 1) unit.stat_smile += unit.love
      if (unit.attribute === 2) unit.stat_pure += unit.love
      if (unit.attribute === 3) unit.stat_cool += unit.love
      unit.bonus_smile = 0
      unit.bonus_pure = 0
      unit.bonus_cool = 0
      unit.center_bonus_smile = 0
      unit.center_bonus_pure = 0
      unit.center_bonus_cool = 0
    }

    // First step: calculate and apply SIS bonus
    await this.applySISbonus(userId, deck)
    await this.calculateCenterUnitBonus(deck)
    // If there a guest (unit_id), calculate Center and Extra bonus from it
    if (guestUnitId) await this.calculateCenterUnitBonus(deck, guestUnitId)

    // Apply Center and Extra bonus.
    // Also do clean-up by setting 'undefined' value
    for (const unit of deck) {
      unit.stat_smile += unit.center_bonus_smile
      unit.stat_pure += unit.center_bonus_pure
      unit.stat_cool += unit.center_bonus_cool
      if (cleanup) {
        unit.bonus_smile = undefined
        unit.bonus_pure = undefined
        unit.bonus_cool = undefined
        unit.center_bonus_smile = undefined
        unit.center_bonus_pure = undefined
        unit.center_bonus_cool = undefined
      }
    }
    return deck
  }
  private async applySISbonus(userId: number, deck: any[]) {
    // Check if our team composed only 
    // of Aqours or Muse (or something else) members
    let fullyComposed = false
    let composedMemberTag = 0
    let _unitTypeIds: number[] = []

    // get member tags that will be trigger for SIS
    let memberTagTrigger = (await unitDB.all("SELECT DISTINCT trigger_type FROM unit_removable_skill_m WHERE trigger_reference_type = 4")).map((type) => {
      return type.trigger_type
    })
    await deck.forEachAsync(async (unit) => {
      let unitTypeId = (await unitDB.get("SELECT unit_type_id FROM unit_m WHERE unit_id = :id", {
        id: unit.unit_id
      })).unit_type_id

      let memberTags = (await unitDB.all("SELECT member_tag_id FROM unit_type_member_tag_m WHERE unit_type_id = :type", {
        type: unitTypeId
      })).map(tag => tag.member_tag_id)

      for (const tag of memberTags) {
        if (memberTagTrigger.includes(tag)) {
          if (composedMemberTag === 0) composedMemberTag = tag
          if (!_unitTypeIds.includes(unitTypeId) && composedMemberTag === tag) _unitTypeIds.push(unitTypeId)
        }
      }
    })
    if (_unitTypeIds.length === 9) fullyComposed = true

    let removableSkills = await new User(this.connection).getRemovableSkillInfo(userId)
    await deck.forEachAsync(async (unit) => {
      if (!removableSkills.equipment_info[unit.unit_owning_user_id]) return

      await removableSkills.equipment_info[unit.unit_owning_user_id].detail.forEachAsync(async (skill: any) => {
        let skillInfo = await unitDB.get("SELECT * FROM unit_removable_skill_m WHERE unit_removable_skill_id = :id", {
          id: skill.unit_removable_skill_id
        })
        if (!skillInfo) throw new Error(`Data for removable skill #${skill.unit_removable_skill_id} is missing`)
        if (skillInfo.effect_type > 3) return // client-side skill

        if (skillInfo.effect_range == 1) { // SIS bonus for unit
          if (skillInfo.fixed_value_flag === 1) { // This is fixed value
            applyFixedBonusForUnit(unit, skillInfo.effect_type, skillInfo.effect_value)
          } else { // Values based on unit stats
            applyBonusForUnit(unit, skillInfo.effect_type, skillInfo.effect_value)
          }
        }

        if (skillInfo.effect_range === 2) { // SIS bonus for deck
          if (skillInfo.trigger_type === 0) { // Skill not tied to Muse or Aqours
            if (skillInfo.fixed_value_flag === 1) {
              applyFixedBonusForDeck(deck, skillInfo.effect_type, skillInfo.effect_value)
            } else {
              applyBonusForDeck(deck, skillInfo.effect_type, skillInfo.effect_value)
            }
          } else if (fullyComposed === true && skillInfo.trigger_type === composedMemberTag) {
            applyBonusForDeck(deck, skillInfo.effect_type, skillInfo.effect_value)
          }
        }
      })
    })

    for (const unit of deck) {
      unit.stat_smile += unit.bonus_smile
      unit.stat_pure += unit.bonus_pure
      unit.stat_cool += unit.bonus_cool
    }
    return deck
  }
  private async calculateCenterUnitBonus(deck: any[], guestUnitId?: number) {
    let skillId = await unitDB.get("SELECT default_leader_skill_id FROM unit_m WHERE unit_id = :id", {
      id: Type.isInt(guestUnitId) ? guestUnitId : deck[4].unit_id
    })
    let leaderSkill = await unitDB.get("SELECT leader_skill_effect_type, effect_value FROM unit_leader_skill_m WHERE unit_leader_skill_id = :id", {
      id: skillId.default_leader_skill_id
    })
    if (!leaderSkill) return deck // This card doesn't have leader skill (and leader extra) bonus

    let attribute = String(leaderSkill.leader_skill_effect_type).split("") // Small hack
    attribute.length > 1 ? attribute[0] = attribute[2] : attribute[1] = attribute[0]
    for (const unit of deck) {
      unit[centerBonus(attribute[0])] += Math.ceil(unit[stat(attribute[1])] * leaderSkill.effect_value / 100)
    }

    let extraSkill = await unitDB.get("SELECT member_tag_id, leader_skill_effect_type, effect_value FROM unit_leader_skill_extra_m WHERE unit_leader_skill_id = :id", {
      id: skillId.default_leader_skill_id
    })
    if (!extraSkill) return deck

    let typeIds = (await unitDB.all("SELECT unit_type_id FROM unit_type_member_tag_m WHERE member_tag_id = :tag", {
      tag: extraSkill.member_tag_id
    })).map(t => t.unit_type_id)

    await Promise.all(deck.map(async (unit) => {
      let typeId = await unitDB.get("SELECT unit_type_id FROM unit_m WHERE unit_id = :id", {
        id: unit.unit_id
      })
      if (typeIds.indexOf(typeId.unit_type_id) === -1) return

      let atb = extraSkill.leader_skill_effect_type
      unit[centerBonus(atb)] += Math.ceil(unit[stat(atb)] * extraSkill.effect_value / 100)
    }))
    return deck
  }

  public async liveGoalAccomp(userId: number, liveDifficultyId: number, scoreRank: number, comboRank: number, completeRank: number) {
    const item = new Item(this.connection)

    let result = {
      achieved_ids: <number[]>[],
      rewards: <any>[]
    }

    let existingGoals = (await this.connection.query(`SELECT * FROM user_live_goal_rewards WHERE user_id=:user AND live_difficulty_id=:diff`, {
      user: userId,
      diff: liveDifficultyId
    })).map(e => e.live_goal_reward_id)
    let liveGoals = await liveDB.all(`SELECT * FROM live_goal_reward_m WHERE live_difficulty_id = :ldid AND live_goal_reward_id NOT IN (${existingGoals.join(",")})`, {
      ldid: liveDifficultyId
    })
    await Promise.all(liveGoals.map(async goal => {
      if (
        (goal.live_goal_type === 1 && goal.rank >= scoreRank) ||
        (goal.live_goal_type === 2 && goal.rank >= comboRank) ||
        (goal.live_goal_type === 3 && goal.rank >= completeRank)
      ) {
        await this.connection.query(`INSERT INTO user_live_goal_rewards VALUES (:user, :goal_id, :difficulty)`, {
          user: userId,
          goal_id: goal.live_goal_reward_id,
          difficulty: liveDifficultyId
        })
        await item.addPresent(userId, {
          type: goal.add_type,
          id: goal.item_id
        }, "Live Show! Reward", goal.amount, true)
        result.achieved_ids.push(goal.live_goal_reward_id)
        result.rewards.push({
          add_type: goal.add_type,
          item_id: goal.item_id,
          item_category_id: goal.item_category_id,
          amount: goal.amount,
          reward_box_flag: false
        })
      }
    }))

    return result
  }

  public async applyKizunaBonusToDeck(userId: number, deck: any[], kizuna: number) {
    for (let i = 0; i < deck.length; i++) {
      deck[i].kizuna_add = 0
      deck[i].fpt_add = 0
    }

    let centerKizuna = Math.ceil(kizuna * 5 / 10)
    kizuna -= centerKizuna
    deck[4].fpt_add = centerKizuna
    while (deck[4].love + deck[4].kizuna_add < deck[4].max_love && centerKizuna > 0) {
      deck[4].kizuna_add++
      centerKizuna--
    }
    kizuna += centerKizuna // return back remain

    while (kizuna > 0) {
      for (let i = 0; i < deck.length; i++) {
        if (i === 4) continue // skip center unit
        if (deck[i].love + deck[i].kizuna_add < deck[i].max_love) {
          deck[i].kizuna_add++
          kizuna--
        }
      }
    }

    await deck.forEachAsync(async (unit) => {
      unit.love = unit.love + unit.kizuna_add
      await new Unit(this.connection).updateAlbum(userId, unit.unit_id, {
        maxRank: unit.is_rank_max,
        maxLove: unit.love + unit.kizuna_add === unit.max_love && unit.rank === unit.max_rank,
        maxLevel: unit.is_level_max,
        addLove: unit.kizuna_add,
        addFavPt: unit.fpt_add
      })
      await this.connection.query("UPDATE units SET love=:love WHERE user_id=:user AND unit_owning_user_id=:id", {
        love: Math.min(unit.love + unit.kizuna_add, unit.max_love),
        user: userId,
        id: unit.unit_owning_user_id
      })
      unit.kizuna_add = undefined
      unit.fpt_add = undefined
    })

    return deck
  }

  public static getAvailableLiveList() {
    return availableLiveList
  }
  public static getNormalLiveList() {
    return normalLiveList
  }
  public static getSpecialLiveList() {
    return specialLiveList
  }
  public static getMarathonLiveList(eventId: number) {
    return marathonLiveList[eventId]
  }
  public static getRank(rankInfo: rankInfo[], value: number): number {
    for (const info of rankInfo) {
      if (info.rank_min <= value && info.rank_max >= value) return info.rank
    }
    return 5
  }
  public static getExpAmount(difficulty: number) {
    return expTable[difficulty]
  }
  public static getEventPointMultipliers(comboRank: number, scoreRank: number) {
    let comboBonus = 1
    let scoreBonus = 1
    // on the official server score bonus for S rank is 1.20 and 1.08 for S combo rank
    // but on this server this values inverted
    switch (comboRank) {
      case 1: comboBonus += 0.20; break
      case 2: comboBonus += 0.15; break
      case 3: comboBonus += 0.10; break
      case 4: comboBonus += 0.05; break
    }
    switch (scoreRank) {
      case 1: scoreBonus += 0.08; break
      case 2: scoreBonus += 0.06; break
      case 3: scoreBonus += 0.04; break
      case 4: scoreBonus += 0.02; break
    }
    return {
      comboBonus,
      scoreBonus
    }
  }
  public static calculateMaxKizuna(maxCombo: number) {
    // Source: https://decaf.kouhi.me/lovelive/index.php?title=Gameplay#Kizuna
    return Math.floor(maxCombo / 10) +
      Math.floor(Math.max(0, maxCombo - 200) / 10) +
      4 * Math.floor(maxCombo / 50) -
      Math.floor(Math.max(0, maxCombo - 200) / 50) +
      5 * Math.floor(maxCombo / 100)
  }
}
(global as any).Live = Live

function bonus(type: number | string) {
  if (typeof type === "string") type = parseInt(type)
  switch (type) {
    case 1: return "bonus_smile"
    case 2: return "bonus_pure"
    case 3: return "bonus_cool"
    default: throw new Error("Unknown attribute")
  }

}
function stat(type: number | string) {
  if (typeof type === "string") type = parseInt(type)
  switch (type) {
    case 1: return "stat_smile"
    case 2: return "stat_pure"
    case 3: return "stat_cool"
    default: throw new Error("Unknown attribute")
  }
}
function centerBonus(type: number | string) {
  if (typeof type === "string") type = parseInt(type)
  switch (type) {
    case 1: return "center_bonus_smile"
    case 2: return "center_bonus_pure"
    case 3: return "center_bonus_cool"
    default: throw new Error("Unknown attribute")
  }
}

function applyBonusForDeck(deck: any, effectType: number, value: number) {
  for (const unit of deck) {
    applyBonusForUnit(unit, effectType, value)
  }
}
function applyFixedBonusForDeck(deck: any, effectType: number, value: number) {
  for (const unit of deck) {
    applyFixedBonusForUnit(unit, effectType, value)
  }
}
function applyBonusForUnit(unit: any, effectType: number, value: number) {
  unit[bonus(effectType)] += Math.ceil(unit[stat(effectType)] * value / 100)
}
function applyFixedBonusForUnit(unit: any, effectType: number, value: number) {
  unit[bonus(effectType)] += value
}