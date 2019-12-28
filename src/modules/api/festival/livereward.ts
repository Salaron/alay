import assert from "assert"
import { TYPE } from "../../../common/type"
import { User } from "../../../common/user"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, Mods, PERMISSION, REQUEST_TYPE, FESTIVAL_BONUS } from "../../../models/constant"
import { ErrorAPI, ErrorUserId } from "../../../models/error"

const liveDB = sqlite3.getLive()
const festDB = sqlite3.getFestival()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramTypes() {
    return {
      perfect_cnt: TYPE.INT,
      great_cnt: TYPE.INT,
      good_cnt: TYPE.INT,
      bad_cnt: TYPE.INT,
      miss_cnt: TYPE.INT,
      love_cnt: TYPE.INT,
      max_combo: TYPE.INT,
      score_smile: TYPE.INT,
      score_cute: TYPE.INT,
      score_cool: TYPE.INT,
      key: TYPE.STRING,
      seed: TYPE.STRING
    }
  }

  public async execute() {
    const currentEvent = await this.event.getEventById(this.params.event_id)
    if (currentEvent.active === false) throw new ErrorAPI(720)

    const session = await this.connection.first("SELECT * FROM event_festival_users WHERE user_id = :user AND event_id = :event", {
      user: this.user_id,
      event: currentEvent.id
    })
    const liveSession = await this.connection.first("SELECT * FROM user_live_progress WHERE user_id = :user AND event_id = :event", {
      user: this.user_id,
      event: currentEvent.id
    })
    if (!session || !liveSession) throw new ErrorAPI(3411, `There is no active festival session`)

    let ranking = await this.connection.first(`SELECT event_point, score FROM event_ranking WHERE user_id = :user AND event_id = :event`, {
      user: this.user_id,
      event: currentEvent.id
    })
    if (ranking.length === 0) ranking = { event_point: 0, score: 0 }

    const trackIds: number[] = session.track_ids.split(",").map(Number)
    const difficultyIds: number[] = session.difficulty_ids.split(",").map(Number)
    const bonusIds: number[] = session.bonus_ids.split(",").map(Number)
    const totalScore = this.params.score_smile + this.params.score_cute + this.params.score_cool
    let liveSettingIds = ""
    assert(difficultyIds.length === trackIds.length)

    // get item bonus info
    if (bonusIds.length === 0) bonusIds.push(0) // fix empty array error
    const bonusItemsData = await festDB.all(`SELECT * FROM event_festival_item_m WHERE bonus_id IN (${bonusIds.join(",")})`)
    // equipedItems[bonus_id] = param
    const usedItems: { [bId: number]: number } = {}
    for (const item of bonusItemsData) {
      usedItems[item.bonus_id] = item.bonus_param > 100 ? item.bonus_param / 100 : item.bonus_param
    }

    // collect info from all lives
    const liveResult = {
      c_rank_combo: 0,
      b_rank_combo: 0,
      a_rank_combo: 0,
      s_rank_combo: 0,
      c_rank_score: 0,
      b_rank_score: 0,
      a_rank_score: 0,
      s_rank_score: 0,
      exp: 0,
      coins: 0,
      base_event_point: 0,
      added_event_point: 0
    }
    const liveList = await Promise.all(trackIds.map(async (trackId, i) => {
      const liveInfo = await liveDB.get(`
      SELECT
        swing_flag, ac_flag, difficulty, live_setting_id, attribute_icon_id as attribute,
        live_track_m.live_track_id, member_category,
        c_rank_score, b_rank_score, a_rank_score, s_rank_score,
        c_rank_combo, b_rank_combo, a_rank_combo, s_rank_combo
      FROM live_setting_m
        INNER JOIN live_track_m ON live_setting_m.live_track_id = live_track_m.live_track_id
      WHERE live_track_m.live_track_id = :trackId AND difficulty = :difficulty`, {
        trackId,
        difficulty: difficultyIds[i]
      })
      if (!liveInfo) throw new Error(`Live data for track #${trackId} and difficulty ${difficultyIds[i]} is missing`)

      liveInfo.live_difficulty_id = (
        await festDB.get(`SELECT live_difficulty_id FROM event_festival_live_m WHERE live_setting_id = :lsid`, {
          lsid: liveInfo.live_setting_id
        })
      ).live_difficulty_id

      if (i === 0) {
        const key = this.event.calcClearKeys(
          this.params.seed,
          liveInfo.live_difficulty_id,
          this.params.score_smile,
          this.params.score_cute,
          this.params.score_cool,
          this.params.max_combo,
          this.params.love_cnt
        )
        if (key !== this.params.key) throw new Error(`Invalid key`)
      }

      // Score
      liveResult.c_rank_score += liveInfo.c_rank_score
      liveResult.b_rank_score += liveInfo.b_rank_score
      liveResult.a_rank_score += liveInfo.a_rank_score
      liveResult.s_rank_score += liveInfo.s_rank_score
      // Combo
      liveResult.c_rank_combo += liveInfo.c_rank_combo
      liveResult.b_rank_combo += liveInfo.b_rank_combo
      liveResult.a_rank_combo += liveInfo.a_rank_combo
      liveResult.s_rank_combo += liveInfo.s_rank_combo
      // Exp
      let expMultiplier = 1
      if (usedItems[FESTIVAL_BONUS.EXP_UP]) {
        expMultiplier = usedItems[FESTIVAL_BONUS.EXP_UP]
      }
      liveResult.exp += Math.ceil(this.live.getExpAmount(difficultyIds[i]) * expMultiplier)
      // Coins
      let coinsMultiplier = 1
      if (usedItems[FESTIVAL_BONUS.GOLD_UP]) {
        coinsMultiplier = usedItems[FESTIVAL_BONUS.GOLD_UP]
      }
      liveResult.coins += Math.ceil(100000 * coinsMultiplier)
      // Event point
      const liveSetting = await festDB.get("SELECT * FROM event_festival_live_setting_m WHERE difficulty = :diff", {
        diff: difficultyIds[i]
      })
      liveResult.base_event_point += liveSetting.event_point

      liveSettingIds += `${liveInfo.live_setting_id}, `
      if (i === trackIds.length - 1) {
        // remove trailling comma
        liveSettingIds = liveSettingIds.slice(0, -2)
      }
      return {
        live_difficulty_id: liveInfo.live_difficulty_id,
        is_random: liveInfo.difficulty === 5 || (liveSession.mods & Mods.RANDOM) > 0,
        ac_flag: liveInfo.ac_flag || 0,
        swing_flag: liveInfo.swing_flag || 0
      }
    }))

    const units = await this.live.getUserDeck(this.user_id, liveSession.deck_id, false, null, true)
    const [beforeUserInfo, nextLevelInfo] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.user.addExp(this.user_id, liveResult.exp),
      this.live.applyKizunaBonusToDeck(this.user_id, units.deck!, this.params.love_cnt)
    ])

    // calculate max kizuna and compare with input
    const maxKizuna = this.live.calculateMaxKizuna(liveResult.s_rank_combo)
    if (this.params.love_cnt > maxKizuna) throw new ErrorUserId(`Too more kizuna...`, this.user_id)
    if (this.params.max_combo > liveResult.s_rank_combo) throw new ErrorUserId("inject detected [max_combo > s_rank_combo]", this.user_id)

    // get rank for score and combo
    const scoreRank = this.live.getRank(this.live.generateRankInfo(liveResult, "score"), totalScore)
    const comboRank = this.live.getRank(this.live.generateRankInfo(liveResult, "combo"), this.params.max_combo)

    // get combo, score and item bonus for event point
    let { comboBonus, scoreBonus } = this.live.getEventPointMultipliers(comboRank, scoreRank)
    let itemBonus = 1
    if (usedItems[FESTIVAL_BONUS.EVENT_POINT_UP]) {
      itemBonus = usedItems[FESTIVAL_BONUS.EVENT_POINT_UP]
    }
    let eventPointMultiplier = (scoreBonus + comboBonus + itemBonus) % 1 + 1
    liveResult.added_event_point = Math.ceil(liveResult.base_event_point * eventPointMultiplier)

    if (!ranking.score || ranking.score < totalScore) {
      await this.event.writeHiScore(this.user_id, currentEvent.id, units.deck, liveList, {
        score: totalScore,
        max_combo: this.params.max_combo,
        perfect_cnt: this.params.perfect_cnt,
        great_cnt: this.params.great_cnt,
        good_cnt: this.params.good_cnt,
        bad_cnt: this.params.bad_cnt,
        miss_cnt: this.params.miss_cnt
      })
    }

    const [afterUserInfo, rewards, eventInfo] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.live.getDefaultRewards(this.user_id, scoreRank, comboRank, liveSession.mods),
      this.event.eventInfoWithRewards(this.user_id, currentEvent.id, currentEvent.name, liveResult.added_event_point, liveResult.base_event_point),
      this.connection.query("DELETE FROM user_live_progress WHERE user_id = :user", {
        user: this.user_id
      }),
      this.connection.query("DELETE FROM event_festival_users WHERE user_id = :user", {
        user: this.user_id
      }),
      this.connection.query(`
      INSERT INTO event_ranking (
        user_id, event_id, event_point, lives_played
      ) VALUES (:user, :eventId, :point, 0) ON DUPLICATE KEY UPDATE
      event_point = event_point + :point, lives_played = lives_played + :liveCnt`, {
        point: liveResult.added_event_point,
        eventId: currentEvent.id,
        user: this.user_id,
        liveCnt: trackIds.length
      }),
      this.live.writeToLog(this.user_id, {
        live_setting_ids: liveSettingIds,
        is_event: true,
        score: totalScore,
        combo: this.params.max_combo,
        combo_rank: comboRank,
        score_rank: scoreRank,
        mods: liveSession.mods
      })
    ])
    const result = {
      rank: scoreRank,
      combo_rank: comboRank,
      total_love: this.params.love_cnt,
      base_reward_info: await this.live.getBaseRewardInfo(beforeUserInfo, afterUserInfo, liveResult.exp, liveResult.coins),
      reward_item_list: {
        live_clear: [],
        live_rank: [],
        live_combo: [],
        guest_bonus: []
      },
      unlocked_subscenario_ids: [],
      effort_point: [],
      is_effort_point_visible: false,
      limited_effort_box: [],
      unit_list: units.deck,
      before_user_info: beforeUserInfo,
      after_user_info: afterUserInfo,
      next_level_info: nextLevelInfo,
      event_info: {
        event_id: currentEvent.id,
        event_point_info: {
          before_event_point: eventInfo!.event_point_info.before_event_point,
          before_total_event_point: eventInfo!.event_point_info.before_total_event_point,
          after_event_point: eventInfo!.event_point_info.after_event_point,
          after_total_event_point: eventInfo!.event_point_info.after_total_event_point,
          base_event_point: eventInfo!.event_point_info.base_event_point,
          added_event_point: eventInfo!.event_point_info.added_event_point,
          score_bonus: scoreBonus,
          combo_bonus: comboBonus,
          item_bonus: itemBonus,
          guest_bonus: 1,
          mission_bonus: 1
        },
        event_reward_info: eventInfo!.event_reward_info,
        event_mission_reward_info: [],
        event_mission_bonus_reward_info: [],
        next_event_reward_info: [],
        event_notice: [],
        mission_status: {
          level: 1,
          chance_count: 1,
          achievement_type: 1,
          achievement_condition_id_list: [
            98
          ],
          is_special: false,
          play_count: 0,
          achieved_count: 0,
          achievement_count: 1,
          description: "",
          time_limit: 0,
          result: 0,
          first_clear_bonus: {
            reward_list: [],
            bonus_list: []
          },
          clear_bonus: {
            reward_list: [],
            bonus_list: []
          }
        }
      },
      daily_reward_info: rewards.daily_reward_info,
      unite_info: [],
      using_buff_info: [],
      class_system: User.getClassSystemStatus(this.user_id),
      unit_support_list: await this.user.getSupportUnits(this.user_id)
    }

    const fakeResult = { rank: 1, combo_rank: 3, total_love: 361, base_reward_info: { player_exp: 548, player_exp_unit_max: { before: 340, after: 340 }, player_exp_friend_max: { before: 29, after: 29 }, player_exp_lp_max: { before: 95, after: 95 }, game_coin: 40500, game_coin_reward_box_flag: false, social_point: 0 }, reward_item_list: { live_clear: [{ add_type: 1001, amount: 1, item_category_id: 0, unit_id: 1024, unit_owning_user_id: 0, is_support_member: true, exp: 0, next_exp: 0, max_hp: 0, level: 1, skill_level: 0, rank: 1, love: 0, is_rank_max: false, is_level_max: false, is_love_max: false, new_unit_flag: false, reward_box_flag: false, unit_skill_exp: 0, display_rank: 1, unit_removable_skill_capacity: 0, rarity: 2 }], live_rank: [{ add_type: 1001, amount: 1, item_category_id: 0, unit_id: 1024, unit_owning_user_id: 0, is_support_member: true, exp: 0, next_exp: 0, max_hp: 0, level: 1, skill_level: 0, rank: 1, love: 0, is_rank_max: false, is_level_max: false, is_love_max: false, new_unit_flag: false, reward_box_flag: false, unit_skill_exp: 0, display_rank: 1, unit_removable_skill_capacity: 0, rarity: 2 }], live_combo: [{ add_type: 1001, amount: 1, item_category_id: 0, unit_id: 353, unit_owning_user_id: null, is_support_member: false, exp: 1229, next_exp: 1394, max_hp: 2, level: 16, skill_level: 0, rank: 1, love: 0, is_rank_max: false, is_level_max: false, is_love_max: false, new_unit_flag: false, reward_box_flag: true, unit_skill_exp: 0, display_rank: 1, unit_removable_skill_capacity: 0, rarity: 1 }], guest_bonus: [{ add_type: 1001, amount: 1, item_category_id: 0, unit_id: 1480, unit_owning_user_id: null, is_support_member: false, exp: 1394, next_exp: 1570, max_hp: 1, level: 17, skill_level: 0, rank: 1, love: 0, is_rank_max: false, is_level_max: false, is_love_max: false, new_unit_flag: false, reward_box_flag: true, unit_skill_exp: 0, display_rank: 1, unit_removable_skill_capacity: 0, rarity: 1 }] }, unlocked_subscenario_ids: [], effort_point: [{ live_effort_point_box_spec_id: 4, capacity: 2000000, before: 915402, after: 2000000, rewards: [{ rarity: 3, item_id: 33, add_type: 5500, amount: 1, item_category_id: 0, reward_box_flag: false, insert_date: "2019-02-20 18:48:30" }, { rarity: 6, item_id: 2, add_type: 3002, amount: 300, item_category_id: 0, reward_box_flag: false }, { rarity: 6, item_id: 2, add_type: 3002, amount: 100, item_category_id: 0, reward_box_flag: false }, { item_id: 4, add_type: 8000, amount: 5, item_category_id: 0, reward_box_flag: false }] }, { live_effort_point_box_spec_id: 4, capacity: 2000000, before: 0, after: 2000000, rewards: [{ rarity: 1, item_id: 10, add_type: 5500, amount: 1, item_category_id: 0, reward_box_flag: false, insert_date: "2017-04-26 17:51:22" }, { rarity: 1, item_id: 2, add_type: 5500, amount: 1, item_category_id: 0, reward_box_flag: false, insert_date: "2017-02-28 02:58:30" }, { rarity: 1, item_id: 3, add_type: 5500, amount: 1, item_category_id: 0, reward_box_flag: false, insert_date: "2017-02-28 02:58:30" }, { item_id: 4, add_type: 8000, amount: 5, item_category_id: 0, reward_box_flag: false }] }, { live_effort_point_box_spec_id: 5, capacity: 4000000, before: 0, after: 685606, rewards: [] }], is_effort_point_visible: true, limited_effort_box: [], unit_list: [{ unit_owning_user_id: 467919915, unit_id: 357, position: 1, level: 80, unit_skill_level: 1, before_love: 500, love: 500, max_love: 500, is_rank_max: true, is_love_max: true, is_level_max: true }, { unit_owning_user_id: 690711253, unit_id: 1270, position: 2, level: 70, unit_skill_level: 1, before_love: 375, love: 375, max_love: 375, is_rank_max: false, is_love_max: false, is_level_max: false }, { unit_owning_user_id: 741956517, unit_id: 982, position: 3, level: 80, unit_skill_level: 1, before_love: 500, love: 500, max_love: 500, is_rank_max: false, is_love_max: false, is_level_max: false }, { unit_owning_user_id: 656130163, unit_id: 1372, position: 4, level: 80, unit_skill_level: 1, before_love: 500, love: 500, max_love: 500, is_rank_max: false, is_love_max: false, is_level_max: false }, { unit_owning_user_id: 741956516, unit_id: 1153, position: 5, level: 80, unit_skill_level: 1, before_love: 500, love: 500, max_love: 500, is_rank_max: false, is_love_max: false, is_level_max: false }, { unit_owning_user_id: 690711224, unit_id: 1287, position: 6, level: 80, unit_skill_level: 1, before_love: 500, love: 500, max_love: 500, is_rank_max: false, is_love_max: false, is_level_max: false }, { unit_owning_user_id: 353078937, unit_id: 611, position: 7, level: 80, unit_skill_level: 1, before_love: 500, love: 500, max_love: 500, is_rank_max: false, is_love_max: false, is_level_max: false }, { unit_owning_user_id: 467919170, unit_id: 947, position: 8, level: 90, unit_skill_level: 1, before_love: 750, love: 750, max_love: 750, is_rank_max: true, is_love_max: true, is_level_max: true }, { unit_owning_user_id: 467919911, unit_id: 863, position: 9, level: 60, unit_skill_level: 1, before_love: 250, love: 250, max_love: 250, is_rank_max: false, is_love_max: false, is_level_max: false }], before_user_info: { level: 140, exp: 203632, previous_exp: 203629, next_exp: 207901, game_coin: 18975009, sns_coin: 6, free_sns_coin: 6, paid_sns_coin: 0, social_point: 795610, unit_max: 340, waiting_unit_max: 300, current_energy: 1, energy_max: 95, training_energy: 5, training_energy_max: 5, energy_full_time: "2019-02-21 04:11:13", friend_max: 29, tutorial_state: -1, over_max_energy: 0, unlock_random_live_muse: 1, unlock_random_live_aqours: 1 }, after_user_info: { level: 140, exp: 204180, previous_exp: 203629, next_exp: 207901, game_coin: 19026509, sns_coin: 7, free_sns_coin: 7, paid_sns_coin: 0, social_point: 796560, unit_max: 340, waiting_unit_max: 300, current_energy: 1, energy_max: 95, training_energy: 5, training_energy_max: 5, energy_full_time: "2019-02-21 04:11:13", friend_max: 29, tutorial_state: -1, over_max_energy: 0, unlock_random_live_muse: 1, unlock_random_live_aqours: 1 }, next_level_info: [{ level: 140, from_exp: 203632 }], event_info: { event_id: 140, event_point_info: { before_event_point: 1696, before_total_event_point: 1696, after_event_point: 3730, after_total_event_point: 3730, base_event_point: 741, added_event_point: 2034, score_bonus: 1.2, combo_bonus: 1.04, item_bonus: 1.1, guest_bonus: 1, mission_bonus: 1 }, event_reward_info: [{ item_id: 4, add_type: 3001, amount: 1, item_category_id: 0, reward_box_flag: false, required_event_point: 2000 }, { item_id: 2, add_type: 3002, amount: 250, item_category_id: 0, reward_box_flag: false, required_event_point: 2400 }, { item_id: 1, add_type: 8000, amount: 1, item_category_id: 0, reward_box_flag: false, required_event_point: 2800 }, { item_id: 173, add_type: 5330, amount: 1, item_category_id: 0, reward_box_flag: false, required_event_point: 3190 }, { item_id: 2, add_type: 3002, amount: 300, item_category_id: 0, reward_box_flag: false, required_event_point: 3200 }, { item_id: 3, add_type: 3000, amount: 11000, item_category_id: 0, reward_box_flag: false, required_event_point: 3600 }], event_mission_reward_info: [{ item_id: 2, add_type: 3002, amount: 100, item_category_id: 0, reward_box_flag: true }], event_mission_bonus_reward_info: [], next_event_reward_info: { event_point: 4000, rewards: [{ item_id: 2, add_type: 3002, amount: 350, item_category_id: 2 }] }, event_notice: [], mission_status: { level: 2, chance_count: 5, achievement_type: 1, achievement_condition_id_list: [98], is_special: false, play_count: 1, achieved_count: 1, achievement_count: 1, description: "\u6b8b\u308a\u4f53\u529b3\u4ee5\u4e0a\u3067\u30d5\u30a7\u30b9\u3092\u6210\u529f", time_limit: 0, result: 1, first_clear_bonus: { reward_list: [{ add_type: 3002, item_id: 2, amount: 100 }], bonus_list: [] }, clear_bonus: { reward_list: [], bonus_list: [] } }, new_mission_status: { level: 3, chance_count: 5, achievement_type: 1, achievement_condition_id_list: [100, 104], is_special: false, play_count: 0, achieved_count: 0, achievement_count: 1, description: "1\u66f2\u4ee5\u4e0aNORMAL\u4ee5\u4e0a\u3067\u3001<br>\u6b8b\u308a\u4f53\u529b8\u4ee5\u4e0a\u3067\u30d5\u30a7\u30b9\u3092\u6210\u529f", time_limit: 0, result: 0, first_clear_bonus: { reward_list: [{ add_type: 3000, item_id: 3, amount: 10000 }], bonus_list: [] }, clear_bonus: { reward_list: [], bonus_list: [] } } }, daily_reward_info: [], unite_info: [], using_buff_info: [], class_system: { rank_info: { before_class_rank_id: 5, after_class_rank_id: 5, rank_up_date: "2019-01-07 20:13:14" }, complete_flag: false, is_opened: true, is_visible: true }, unit_support_list: [{ unit_id: 28, amount: 5 }, { unit_id: 29, amount: 11 }, { unit_id: 30, amount: 14 }, { unit_id: 89, amount: 29 }, { unit_id: 379, amount: 15 }, { unit_id: 380, amount: 8 }, { unit_id: 381, amount: 23 }, { unit_id: 382, amount: 133 }, { unit_id: 383, amount: 3 }, { unit_id: 384, amount: 2 }, { unit_id: 385, amount: 1 }, { unit_id: 386, amount: 7 }, { unit_id: 632, amount: 14 }, { unit_id: 1024, amount: 20 }, { unit_id: 1050, amount: 5 }, { unit_id: 1072, amount: 15 }, { unit_id: 1142, amount: 6 }, { unit_id: 1355, amount: 2 }, { unit_id: 1356, amount: 3 }, { unit_id: 1410, amount: 2 }, { unit_id: 1411, amount: 7 }, { unit_id: 1498, amount: 2 }], server_timestamp: 1550656110 }
    return {
      status: 200,
      result
    }
  }
}
