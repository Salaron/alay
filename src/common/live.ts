import { Connection } from "../core/database"
import { Log } from "../core/log"

const log = new Log("Common: Live")

const liveDB = sqlite3.getLive()
const liveNotesDB = sqlite3.getNotes()
const festDB = sqlite3.getFestival()
const unitDB = sqlite3.getUnit()

let availableLiveList: number[] = []
let normalLiveList: number[] = []
let specialLiveList: number[] = []
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

  // only for special or normal lives not event
  public async getLiveDataByDifficultyId(liveDifficultyId: number) {
    let data = await liveDB.get(`
    SELECT 
      c_rank_score, b_rank_score, a_rank_score, s_rank_score, 
      c_rank_combo, b_rank_combo, a_rank_combo, s_rank_combo, 
      c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete,
      difficulty, ac_flag, swing_flag, setting.live_setting_id, difficulty.live_difficulty_id
    FROM live_setting_m as setting INNER JOIN (
      SELECT 
        live_setting_id, live_difficulty_id, 
        c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
      FROM special_live_m 
      UNION 
      SELECT 
        live_setting_id, live_difficulty_id, 
        c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete 
      FROM normal_live_m
    ) as difficulty ON setting.live_setting_id = difficulty.live_setting_id 
    WHERE live_difficulty_id = :ldid`, { ldid: liveDifficultyId })
    if (!data) throw new Error(`Live Data for live difficulty id #${liveDifficultyId} is missing`)
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
    deck = deck.map(d => Unit.parseUnitData(d))

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

  public static getAvailableLiveList() {
    return availableLiveList
  }
  public static getNormalLiveList() {
    return normalLiveList
  }
  public static getSpecialLiveList() {
    return specialLiveList
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