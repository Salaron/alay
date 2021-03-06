import { Logger } from "../core/logger"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import { Mods } from "../models/constant"
import { ErrorAPI } from "../models/error"
import { Randomizer } from "./live/randomizer"

const log = new Logger("Live")

const customLiveDB = sqlite3.getCustomLiveSVDB()
const liveDB = sqlite3.getLiveDB()
const liveNotesDB = sqlite3.getLiveNotesSVDB()
const marathonDB = sqlite3.getMarathonDB()
const unitDB = sqlite3.getUnitDB()

const expTable = [0, 12, 26, 46, 65, 71, 84]

const availableLiveSettingIds: number[] = [] // Live setting ids that exists in sv_live_notes.db_
const normaLiveSettingIds: number[] = [] // Available normal live setting ids
const specialLiveSettingIds: number[] = [] // Available special live setting ids
const marathonLiveList: { [eventId: number]: number[] } = {}
export async function init() {
  const allLiveSettings = await liveDB.all("SELECT live_setting_id, notes_setting_asset FROM live_setting_m")
  const availableNotesAssets = (await liveNotesDB.all("SELECT notes_setting_asset FROM live_notes")).map(obj => obj.notes_setting_asset)

  for (const liveSetting of allLiveSettings) {
    if (availableNotesAssets.includes(liveSetting.notes_setting_asset))
      availableLiveSettingIds.push(liveSetting.live_setting_id)
  }
  log.info(`Found note data for ${availableLiveSettingIds.length} lives`)

  const normal = await liveDB.all("SELECT live_difficulty_id, live_setting_id FROM normal_live_m")
  for (const liveSetting of normal) {
    if (availableLiveSettingIds.includes(liveSetting.live_setting_id))
      normaLiveSettingIds.push(liveSetting.live_difficulty_id)
    else
      log.verbose(`Missing Note Data for Normal Live #${liveSetting.live_difficulty_id} (Setting #${liveSetting.live_setting_id})`)
  }
  log.info(`Found data for ${normaLiveSettingIds.length} normal lives`)

  const special = await liveDB.all("SELECT live_difficulty_id, live_setting_id FROM special_live_m")
  for (const liveSetting of special) {
    if (availableLiveSettingIds.includes(liveSetting.live_setting_id))
      specialLiveSettingIds.push(liveSetting.live_difficulty_id)
    else
      log.verbose(`Missing Note Data for Special Live #${liveSetting.live_difficulty_id} (Setting #${liveSetting.live_setting_id})`)
  }
  log.info(`Found data for ${specialLiveSettingIds.length} special lives`)

  const marathon = await marathonDB.all(`
  SELECT
    event_id, live.live_difficulty_id, live_setting_id
  FROM
    event_marathon_live_m as live
  JOIN event_marathon_live_schedule_m as schedule
    ON schedule.live_difficulty_id = live.live_difficulty_id`)
  for (const live of marathon) {
    if (availableLiveSettingIds.includes(live.live_setting_id)) {
      if (!marathonLiveList[live.event_id]) marathonLiveList[live.event_id] = []
      marathonLiveList[live.event_id].push(live.live_difficulty_id)
    } else {
      log.verbose(`Missing Note Data for Marathon Live #${live.live_difficulty_id} (Setting #${live.live_setting_id})`)
    }
  }
}

export class Live extends CommonModule {
  public getAvailableLiveSettingIds() {
    return availableLiveSettingIds
  }
  public getNormalLiveSettingIds() {
    return normaLiveSettingIds
  }
  public getSpecialLiveSettingIds() {
    return specialLiveSettingIds
  }
  constructor(action: BaseAction) {
    super(action)
  }

  public async getLiveNotes(userId: number, liveData: liveData, isEvent = false) {
    const params = await this.action.user.getParams(userId)

    let vanish = false
    let random = false
    let mirror = false
    let hp = 0
    if ((isEvent === true && params.event === 1) || isEvent === false) {
      vanish = params.vanish !== 0 && typeof params.vanish === "number"
      mirror = !!params.mirror
      random = !!params.random && liveData.ac_flag !== 1
    }
    if (isEvent === false) {
      if (params.hp === 1) hp = 1999
      if (params.hp === 2) hp = 1
    }

    let liveNotes = null
    if (typeof liveData.custom_live_id === "number") {
      // custom live
      liveNotes = await customLiveDB.get("SELECT json FROM custom_live_notes WHERE custom_live_id = :id", {
        id: liveData.custom_live_id
      })
    }
    if (typeof liveData.notes_setting_asset === "string") {
      // usual live
      liveNotes = await liveNotesDB.get("SELECT json FROM live_notes WHERE notes_setting_asset = :asset", {
        asset: liveData.notes_setting_asset
      })
    }
    if (!liveNotes)
      throw new Error(`Live notes data for LSID #${liveData.live_setting_id} is missing in database`)

    liveNotes = <any[]>JSON.parse(liveNotes.json)

    for (const note of liveNotes) {
      if (!mirror && !vanish) break
      if (mirror) {
        note.position = 10 - note.position
      }
      if (vanish) {
        note.vanish = vanish
      }
    }
    if (random === true) {
      liveNotes = new Randomizer(liveNotes).randomize()
    }

    return {
      mods: {
        vanish,
        random,
        mirror,
        hp
      },
      liveNotes
    }
  }

  public async getCustomLiveData(customLiveId: number | string): Promise<liveData> {
    const liveData = await customLiveDB.get(`
    SELECT * FROM custom_live
      JOIN custom_live_setting ON custom_live.custom_live_id = custom_live_setting.custom_live_id
    WHERE custom_live.custom_live_id = :customLiveId`, {
      customLiveId
    })
    if (!liveData) throw new ErrorAPI("Custom Live Data is missing")
    liveData.live_difficulty_id = liveData.live_setting_id = liveData.custom_live_id
    liveData.capital_type = 1
    liveData.capital_value = 0
    liveData.marathon_live = false
    liveData.score_rank_info = this.generateRankInfo(liveData, "score")
    liveData.combo_rank_info = this.generateRankInfo(liveData, "combo")
    liveData.complete_rank_info = this.generateRankInfo(liveData, "complete")
    return liveData
  }

  /**
   * Only for special, normal or marathon lives for now.
   */
  public async getLiveDataByDifficultyId(liveDifficultyId: number): Promise<liveData> {
    let data = await liveDB.get(`
    SELECT
      c_rank_score, b_rank_score, a_rank_score, s_rank_score,
      c_rank_combo, b_rank_combo, a_rank_combo, s_rank_combo,
      c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete,
      difficulty, ac_flag, swing_flag, setting.live_setting_id, difficulty.live_difficulty_id,
      capital_type, capital_value, notes_setting_asset
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
      // Token (marathon) live?
      data = {
        marathon_live: true
      }
      const tokenData = await marathonDB.get(`
      SELECT
        live_difficulty_id, live_setting_id, capital_type, capital_value, random_flag,
        c_rank_complete, b_rank_complete, a_rank_complete, s_rank_complete
      FROM event_marathon_live_m
      WHERE live_difficulty_id = :ldid`, { ldid: liveDifficultyId })
      if (!tokenData) throw new Error(`Live data for live difficulty id #${liveDifficultyId} is missing`)
      const settingData = await liveDB.get(`
      SELECT
        c_rank_score, b_rank_score, a_rank_score, s_rank_score,
        c_rank_combo, b_rank_combo, a_rank_combo, s_rank_combo,
        difficulty, ac_flag, swing_flag, live_setting_id
      FROM live_setting_m a WHERE live_setting_id = :lsid`, { lsid: tokenData.live_setting_id })
      if (!settingData) throw new Error(`Live data for live setting id #${tokenData.live_setting_id} is missing`)
      data = {
        ...tokenData,
        ...settingData
      }
    }
    if (!data.random_flag) data.random_flag = 0
    if (!data.marathon_live) data.marathon_live = false
    data.score_rank_info = this.generateRankInfo(data, "score")
    data.combo_rank_info = this.generateRankInfo(data, "combo")
    data.complete_rank_info = this.generateRankInfo(data, "complete")
    return data
  }

  public async getUserDeck(userId: number, deckId: number, calculateScore = true, guestUnitId?: number | null, includeDeckData?: boolean, cleanup = true) {
    let deck = await this.connection.query(`
    SELECT
      max_removable_skill_capacity, units.unit_owning_user_id,
      slot_id, unit_id, stat_smile, stat_pure, stat_cool, max_hp,
      attribute, love, level, unit_skill_level, max_love,
      max_rank, max_level, max_skill_level, display_rank, \`rank\`
    FROM user_unit_deck_slot
    JOIN units
      ON units.unit_owning_user_id = user_unit_deck_slot.unit_owning_user_id
    WHERE user_unit_deck_slot.user_id = :user AND deck_id = :deck`, { user: userId, deck: deckId })
    if (deck.length !== 9) throw new ErrorAPI(`Invalid deck`)
    deck = deck.map((unit) => {
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
        rank: unit.display_rank,
        display_rank: unit.display_rank,
        is_rank_max: unit.rank >= unit.max_rank,
        is_love_max: unit.love >= unit.max_love && unit.rank >= unit.max_rank,
        is_level_max: unit.level >= unit.max_level && unit.rank >= unit.max_rank,
        is_skill_level_max: unit.unit_skill_level >= unit.max_skill_level
      }
    })

    if (calculateScore) {
      await this.calculateScoreBonus(userId, deck, guestUnitId, cleanup)
    }

    const units = []
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

  public async calculateScoreBonus(userId: number, deck: any[], guestUnitId?: number | null, cleanup = true) {
    // 1. Apply love (kizuna) bonus
    // 2. Apply SIS bonus
    // 3. Calculate Center and Extra bonus of center unit
    // 4. Caclulate Center and Extra bonus of guest if exists
    // 5. Apply Center and Extra bonus

    // "bonus" fields will be removed if cleanup flag is true
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
    // Second step: calculate and apply center bonus
    await this.calculateCenterUnitBonus(deck)
    // If there a guest (unit_id), calculate Center and Extra bonus from it
    if (guestUnitId) await this.calculateCenterUnitBonus(deck, guestUnitId)

    // Apply Center and Extra bonus.
  // Also do cleanup by setting 'undefined' to it
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

  public async liveGoalAccomp(userId: number, liveDifficultyId: number, scoreRank: number, comboRank: number, completeRank: number) {
    const result = {
      achieved_ids: <number[]>[],
      rewards: <any>[]
    }

    const existingGoals = (await this.connection.query(`SELECT * FROM user_live_goal_rewards WHERE user_id=:user AND live_difficulty_id=:diff`, {
      user: userId,
      diff: liveDifficultyId
    })).map((e) => e.live_goal_reward_id)
    const liveGoals = await liveDB.all(`SELECT * FROM live_goal_reward_m WHERE live_difficulty_id = :ldid AND live_goal_reward_id NOT IN (${existingGoals.join(",")})`, {
      ldid: liveDifficultyId
    })
    await Promise.all(liveGoals.map(async (goal) => {
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
        await this.action.item.addPresent(userId, {
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
    for (const unit of deck) {
      unit.kizuna_add = 0
      unit.fpt_add = 0
      unit.kizuna_max = false
    }

    let centerKizuna = Math.ceil(kizuna / 2)
    deck[4].kizuna_add += Math.min(deck[4].max_love, deck[4].love + centerKizuna) - deck[4].love
    kizuna -= deck[4].kizuna_add // take from all

    let finishCalculation = false
    while (kizuna > 0 && finishCalculation === false) {
      finishCalculation = true
      for (let i = 0; i < deck.length; i++) {
        if (kizuna === 0) break
        if (i === 4) continue // skip center unit
        if (deck[i].love + deck[i].kizuna_add < deck[i].max_love) {
          deck[i].kizuna_add++
          kizuna--
          if (deck[i].love + deck[i].kizuna_add === deck[i].max_love) {
            deck[i].kizuna_max = true
            if (deck[i].is_rank_max) deck[i].love_max = true
          }
          finishCalculation = false
        }
      }
    }

    // add leftover to center
    deck[4].kizuna_add += Math.min(deck[4].max_love, deck[4].love + kizuna) - deck[4].love
    deck[4].fpt_add += deck[4].kizuna_add
    if (deck[4].love + deck[4].kizuna_add >= deck[4].max_love) {
      deck[4].kizuna_max = true
      if (deck[4].is_rank_max) deck[4].love_max = true
    }

    await deck.forEachAsync(async unit => {
      await this.action.unit.updateAlbum(userId, unit.unit_id, {
        maxRank: unit.is_rank_max,
        maxLove: Math.min(unit.love + unit.kizuna_add, unit.max_love) === unit.max_love && unit.rank === unit.max_rank,
        maxLevel: unit.is_level_max && unit.rank === unit.max_rank,
        addLove: unit.kizuna_add,
        addFavPt: unit.fpt_add
      })
      await this.connection.query("UPDATE units SET love=:love WHERE user_id=:user AND unit_owning_user_id=:id", {
        love: Math.min(unit.love + unit.kizuna_add, unit.max_love),
        user: userId,
        id: unit.unit_owning_user_id
      })
      if (unit.kizuna_max && unit.is_rank_max) {
        await this.action.item.addPresent(userId, {
          name: "lg"
        }, "Unit bond max", 1, true)
      }
      unit.love = Math.min(unit.love + unit.kizuna_add, unit.max_love)
      unit.fpt_add = unit.kizuna_add = unit.kizuna_max = undefined
      return unit
    })

    return deck
  }

  public async writeToLog(userId: number, result: writeToLogResult) {
    await this.connection.execute("INSERT INTO user_live_log (user_id, live_setting_id, live_setting_ids, is_event, score, combo, combo_rank, score_rank, mods) VALUES (:user, :lsid, :lsids, :event, :score, :combo, :combo_r, :score_r, :mods)", {
      user: userId,
      lsid: result.live_setting_id,
      lsids: result.live_setting_ids,
      event: result.is_event,
      score: result.score,
      combo: result.combo,
      combo_r: result.combo_rank,
      score_r: result.score_rank,
      mods: result.mods || 0
    })
  }

  public async getDefaultRewards(userId: number, scoreRank: number, comboRank: number, modsInt: number) {
    let multiplier = modsInt & Mods.NO_FAIL ? 0.4 : 1
    let rndGT = Math.floor(Math.random() * (5)) + 1
    let rndBT = Math.floor(Math.random() * (3)) + 1
    let rndLG = Math.floor(Math.random() * (10 * (7 - comboRank) - 10 * (6 - comboRank) + 1)) + 10 * (6 - comboRank)
    let dailyReward = await Promise.all([
      this.action.item.addPresent(userId, {
        name: "gt"
      }, "Live Show! Reward", Math.ceil(rndGT * multiplier)),
      this.action.item.addPresent(userId, {
        name: "bt"
      }, "Live Show! Reward", Math.ceil(rndBT * multiplier)),
      this.action.item.addPresent(userId, {
        name: "lg"
      }, "Live Show! Reward", Math.ceil(rndLG * multiplier))
    ])

    // Random SiS
    if (Math.random() < 0.2) {
      dailyReward.push(await this.action.item.addPresent(userId, {
        name: "sis",
        id: this.action.unit.getRemovableSkillIds().randomValue()
      }, "Live Show! Reward", 2))
    }

    let rewardUnitList = {
      live_clear: <any[]>[],
      live_rank: <any[]>[],
      live_combo: <any[]>[]
    }

    const [r, sr, ur] = await Promise.all([
      unitDB.all("SELECT unit_id FROM unit_m WHERE disable_rank_up != 0 AND rarity = 2"),
      unitDB.all("SELECT unit_id FROM unit_m WHERE disable_rank_up != 0 AND rarity = 3"),
      unitDB.all("SELECT unit_id FROM unit_m WHERE disable_rank_up != 0 AND rarity = 4")
    ])

    let scoreReward = null
    let comboReward = null
    switch (scoreRank) {
      case 1: scoreReward = ur.randomValue().unit_id; break
      case 2: scoreReward = sr.randomValue().unit_id; break
      case 3:
      case 4: scoreReward = r.randomValue().unit_id; break
    }
    switch (comboRank) {
      case 1: comboReward = ur.randomValue().unit_id; break
      case 2: comboReward = sr.randomValue().unit_id; break
      case 3:
      case 4: comboReward = r.randomValue().unit_id; break
    }
    if (multiplier < 1) {
      scoreReward = null
      comboReward = null
    }
    if (scoreReward != null) {
      let res = await this.action.item.addPresent(userId, {
        name: "card",
        id: scoreReward
      }, "Live Show! Reward", 1, true)
      res.new_unit_flag = false
      rewardUnitList.live_rank.push(res)
    }
    if (comboReward != null) {
      let res = await this.action.item.addPresent(userId, {
        name: "card",
        id: comboReward
      }, "Live Show! Reward", 1, true)
      res.new_unit_flag = false
      rewardUnitList.live_combo.push(res)
    }
    let res = await this.action.item.addPresent(userId, {
      name: "card",
      id: this.action.unit.getSupportUnitList().randomValue()
    }, "Live Show! Reward", 1, true)
    res.new_unit_flag = false
    rewardUnitList.live_clear.push(res)

    return {
      daily_reward_info: dailyReward,
      reward_unit_list: rewardUnitList
    }
  }

  public async getBaseRewardInfo(beforeUserInfo: any, afterUserInfo: any, addedExp: number, addedCoins: number) {
    await this.action.item.addItemToUser(this.userId, {
      name: "coins"
    }, addedCoins)
    return {
      player_exp: addedExp,
      player_exp_unit_max: {
        before: beforeUserInfo.unit_max,
        after: afterUserInfo.unit_max
      },
      player_exp_friend_max: {
        before: beforeUserInfo.friend_max,
        after: afterUserInfo.friend_max
      },
      player_exp_lp_max: {
        before: beforeUserInfo.energy_max,
        after: afterUserInfo.energy_max
      },
      game_coin: addedCoins,
      game_coin_reward_box_flag: false,
      social_point: 0
    }
  }

  public getMarathonLiveList(eventId: number) {
    return marathonLiveList[eventId]
  }

  public getRank(rankInfo: rankInfo[], value: number): number {
    for (const info of rankInfo) {
      if (info.rank_min <= value && (info.rank_max >= value || info.rank_max === 0)) return info.rank
    }
    return 5
  }

  public getExpAmount(difficulty: number) {
    return expTable[difficulty]
  }

  public getEventPointMultipliers(comboRank: number, scoreRank: number) {
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

  public calculateMaxKizuna(maxCombo: number) {
    // Source: https://decaf.kouhi.me/lovelive/index.php?title=Gameplay#Kizuna
    return Math.floor(maxCombo / 10) +
      Math.floor(Math.max(0, maxCombo - 200) / 10) +
      4 * Math.floor(maxCombo / 50) -
      Math.floor(Math.max(0, maxCombo - 200) / 50) +
      5 * Math.floor(maxCombo / 100)
  }

  public generateRankInfo(rankData: Partial<generateRankInfoInput>, type: "score" | "combo" | "complete"): rankInfo[] {
    ["c", "b", "a", "s"].map(rank => {
      if (
        typeof rankData[`${rank}_rank_${type}`] !== "number" ||
        isNaN(parseInt(<any>rankData[`${rank}_rank_${type}`]))
      ) throw new Error(`property "${rank}_rank_${type}" should be integer`)
    })
    return [
      { rank: 5, rank_min: 0, rank_max: rankData[`c_rank_${type}`]! - 1 },
      { rank: 4, rank_min: rankData[`c_rank_${type}`]!, rank_max: rankData[`b_rank_${type}`]! - 1 },
      { rank: 3, rank_min: rankData[`b_rank_${type}`]!, rank_max: rankData[`a_rank_${type}`]! - 1 },
      { rank: 2, rank_min: rankData[`a_rank_${type}`]!, rank_max: rankData[`s_rank_${type}`]! - 1 },
      { rank: 1, rank_min: rankData[`s_rank_${type}`]!, rank_max: 0 }
    ]
  }

  private async applySISbonus(userId: number, deck: any[]) {
    // Check if our team composed only
    // of Aqours or Muse (or something else) members
    let fullyComposed = false
    let composedMemberTag = 0
    const _unitTypeIds: number[] = [] // tslint:disable-line

    // get member tags that will be trigger for SIS
    const memberTagTrigger = (await unitDB.all("SELECT DISTINCT trigger_type FROM unit_removable_skill_m WHERE trigger_reference_type = 4")).map((type) => {
      return type.trigger_type
    })
    await deck.forEachAsync(async (unit) => {
      const unitTypeId = (await unitDB.get("SELECT unit_type_id FROM unit_m WHERE unit_id = :id", {
        id: unit.unit_id
      })).unit_type_id

      const memberTags = (await unitDB.all("SELECT member_tag_id FROM unit_type_member_tag_m WHERE unit_type_id = :type", {
        type: unitTypeId
      })).map((tag) => tag.member_tag_id)

      for (const tag of memberTags) {
        if (memberTagTrigger.includes(tag)) {
          if (composedMemberTag === 0) composedMemberTag = tag
          if (!_unitTypeIds.includes(unitTypeId) && composedMemberTag === tag) _unitTypeIds.push(unitTypeId)
        }
      }
    })
    if (_unitTypeIds.length === 9) fullyComposed = true

    const removableSkills = await this.action.user.getRemovableSkillInfo(userId)
    await deck.forEachAsync(async (unit) => {
      if (!removableSkills.equipment_info[unit.unit_owning_user_id]) return

      await removableSkills.equipment_info[unit.unit_owning_user_id].detail.forEachAsync(async (skill: any) => {
        const skillInfo = await unitDB.get("SELECT * FROM unit_removable_skill_m WHERE unit_removable_skill_id = :id", {
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
    const skillId = await unitDB.get("SELECT default_leader_skill_id FROM unit_m WHERE unit_id = :id", {
      id: Type.isInt(guestUnitId) ? guestUnitId : deck[4].unit_id
    })
    const leaderSkill = await unitDB.get("SELECT leader_skill_effect_type, effect_value FROM unit_leader_skill_m WHERE unit_leader_skill_id = :id", {
      id: skillId.default_leader_skill_id
    })
    if (!leaderSkill) return deck // This card doesn't have leader skill (and leader extra) bonus

    // Small hack
    const attribute = String(leaderSkill.leader_skill_effect_type).split("")
    attribute.length > 1 ? attribute[0] = attribute[2] : attribute[1] = attribute[0]
    for (const unit of deck) {
      unit[centerBonus(attribute[0])] += Math.ceil(unit[stat(attribute[1])] * leaderSkill.effect_value / 100)
    }

    const extraSkill = await unitDB.get("SELECT member_tag_id, leader_skill_effect_type, effect_value FROM unit_leader_skill_extra_m WHERE unit_leader_skill_id = :id", {
      id: skillId.default_leader_skill_id
    })
    if (!extraSkill) return deck

    const typeIds = (await unitDB.all("SELECT unit_type_id FROM unit_type_member_tag_m WHERE member_tag_id = :tag", {
      tag: extraSkill.member_tag_id
    })).map((t) => t.unit_type_id)

    await Promise.all(deck.map(async (unit) => {
      const typeId = await unitDB.get("SELECT unit_type_id FROM unit_m WHERE unit_id = :id", {
        id: unit.unit_id
      })
      if (typeIds.indexOf(typeId.unit_type_id) === -1) return

      const atb = extraSkill.leader_skill_effect_type
      unit[centerBonus(atb)] += Math.ceil(unit[stat(atb)] * extraSkill.effect_value / 100)
    }))
    return deck
  }
}

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
