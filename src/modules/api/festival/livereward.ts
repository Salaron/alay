import assert from "assert"
import { TYPE } from "../../../common/type"
import { User } from "../../../common/user"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, FESTIVAL_BONUS, Mods, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const liveDB = sqlite3.getLiveDB()
const festDB = sqlite3.getFestivalDB()

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
    if (this.params.love_cnt > maxKizuna) throw new Error("Too more kizuna...")
    if (this.params.max_combo > liveResult.s_rank_combo) throw new Error("inject detected [max_combo > s_rank_combo]")

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

    const [afterUserInfo, defaultRewards, eventInfo, unitSupportList] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.live.getDefaultRewards(this.user_id, scoreRank, comboRank, liveSession.mods),
      this.event.eventInfoWithRewards(this.user_id, currentEvent.id, currentEvent.name, liveResult.added_event_point, liveResult.base_event_point),
      this.user.getSupportUnits(this.user_id),
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
      this.live.saveResultToLog(this.user_id, {
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
        ...defaultRewards.reward_unit_list,
        guest_bonus: []
      },
      unlocked_subscenario_ids: [],
      unlocked_multi_unit_scenario_ids: [],
      effort_point: [
        // TODO
        {
          live_effort_point_box_spec_id: 2,
          capacity: 1,
          before: 0,
          after: 0,
          rewards: []
        }
      ],
      is_effort_point_visible: true,
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
        next_event_reward_info: eventInfo.next_event_reward_info,
        event_notice: []
      },
      daily_reward_info: defaultRewards.daily_reward_info,
      unite_info: [],
      using_buff_info: [],
      class_system: User.getClassSystemStatus(this.user_id),
      unit_support_list: unitSupportList
    }

    return {
      status: 200,
      result
    }
  }
}
