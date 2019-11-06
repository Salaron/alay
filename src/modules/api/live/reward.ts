import assert from "assert"
import { EventStub } from "../../../common/eventstub"
import { TYPE } from "../../../common/type"
import { User } from "../../../common/user"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

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
      live_difficulty_id: TYPE.INT,
      event_point: TYPE.INT
    }
  }

  public paramCheck() {
    assert(this.params.event_point < 35, "Too more event point")
  }

  public async execute() {
    const totalScore = this.params.score_smile + this.params.score_cute + this.params.score_cool
    let eventLive = false

    // check if live session is active
    const session = await this.connection.first("SELECT * FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    if (!session) throw new ErrorCode(3411, "ERROR_CODE_LIVE_PLAY_DATA_NOT_FOUND")
    if (session.live_difficulty_id != this.params.live_difficulty_id) throw new ErrorCode(3411, "ERROR_CODE_LIVE_PLAY_DATA_NOT_FOUND")

    const [beforeUserInfo, currentEvent, liveData] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.eventStub.getEventStatus(EventStub.getEventTypes().TOKEN),
      this.live.getLiveDataByDifficultyId(this.params.live_difficulty_id)
    ])

    if (liveData.capital_type === 2) { // token live
      if (!currentEvent.active) throw new ErrorCode(3418, "ERROR_CODE_LIVE_EVENT_HAS_GONE")
      if (currentEvent.active && this.live.getMarathonLiveList(currentEvent.id).includes(this.params.live_difficulty_id)) eventLive = true
    }

    const maxKizuna = this.live.calculateMaxKizuna(liveData.s_rank_combo)
    if (this.params.love_cnt > maxKizuna) throw new ErrorUser(`Too more kizuna (max: ${maxKizuna}, provided: ${this.params.love_cnt})`, this.user_id)
    let deck = (await this.live.getUserDeck(this.user_id, session.deck_id, false, undefined, true)).deck
    deck = await this.live.applyKizunaBonusToDeck(this.user_id, deck!, this.params.love_cnt)

    await this.connection.execute(`INSERT INTO user_live_status VALUES (:user, :diff, :setting, 2, :score,:combo, clear_cnt + 1)
    ON DUPLICATE KEY UPDATE clear_cnt=clear_cnt + 1`, {
      user: this.user_id,
      setting: session.live_setting_id,
      score: totalScore,
      combo: this.params.max_combo,
      diff: session.live_difficulty_id
    })
    const liveStatus = await this.connection.first(`SELECT hi_score, hi_combo, clear_cnt FROM user_live_status WHERE user_id=:user AND live_difficulty_id = :ldid`, {
      user: this.user_id,
      ldid: this.params.live_difficulty_id
    })

    const hiScore = Math.max(liveStatus.hi_score, totalScore)
    const maxCombo = Math.max(liveStatus.hi_combo, this.params.max_combo)
    await this.connection.execute(`UPDATE user_live_status SET hi_score = :score, hi_combo = :combo WHERE user_id = :user AND live_difficulty_id = :ldid`, {
      score: hiScore,
      combo: maxCombo,
      user: this.user_id,
      ldid: this.params.live_difficulty_id
    })

    const scoreRank = this.live.getRank(liveData.score_rank_info, totalScore)
    const comboRank = this.live.getRank(liveData.combo_rank_info, this.params.max_combo)
    const completeRank = this.live.getRank(liveData.complete_rank_info, liveStatus.clear_cnt)
    const goalAccomp = await this.live.liveGoalAccomp(this.user_id, this.params.live_difficulty_id, scoreRank, comboRank, completeRank)

    let exp = this.live.getExpAmount(liveData.difficulty)
    if (scoreRank === 5) exp = Math.floor(exp / 2)
    const [nextLevelInfo, defaultRewards] = await Promise.all([
      this.user.addExp(this.user_id, exp),
      this.live.getDefaultRewards(this.user_id, scoreRank, comboRank),
      this.item.addPresent(this.user_id, {
        name: "coins",
      }, "Live Show! Reward", 100000, true)
    ])
    let afterUserInfo = await this.user.getUserInfo(this.user_id)

    const response = {
      live_info: [
        {
          live_difficulty_id: session.live_difficulty_id,
          is_random: liveData.random_flag || liveData.difficulty === 5,
          ac_flag: liveData.ac_flag,
          swing_flag: liveData.swing_flag
        }
      ],
      rank: scoreRank,
      combo_rank: comboRank,
      total_love: this.params.love_cnt,
      is_high_score: totalScore >= liveStatus.hi_score,
      hi_score: Math.max(totalScore, liveStatus.hi_score),
      base_reward_info: {
        player_exp: exp,
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
        game_coin: 100000,
        game_coin_reward_box_flag: false,
        social_point: 0
      },
      reward_unit_list: defaultRewards.reward_unit_list,
      unlocked_subscenario_ids: [],
      effort_point: [],
      is_effort_point_visible: false,
      limited_effort_box: [],
      unit_list: deck,
      before_user_info: beforeUserInfo,
      after_user_info: afterUserInfo,
      next_level_info: nextLevelInfo,
      goal_accomp_info: goalAccomp,
      special_reward_info: [],
      event_info: <any>[],
      daily_reward_info: defaultRewards.daily_reward_info,
      can_send_friend_request: false,
      unit_support_list: await this.user.getSupportUnits(this.user_id),
      unite_info: [],
      class_system: User.getClassSystemStatus(this.user_id)
    }

    await this.live.writeToLog(this.user_id, {
      live_setting_id: liveData.live_setting_id,
      is_event: false,
      score: totalScore,
      combo: this.params.max_combo,
      combo_rank: comboRank,
      score_rank: scoreRank
    })
    await this.connection.query(`DELETE FROM user_live_progress WHERE user_id = :user`, { user: this.user_id })
    if (currentEvent.active) {
      const userStatus = await this.connection.first(`SELECT token_point, score FROM event_ranking WHERE user_id = :user AND event_id = :event`, {
        user: this.user_id,
        event: currentEvent.id
      })
      if (eventLive) {
        this.params.event_point = this.eventStub.getTokenEventPoint(liveData.difficulty, comboRank, scoreRank) * session.lp_factor
        if (!userStatus.score || userStatus.score < totalScore) {
          await this.eventStub.writeHiScore(this.user_id, currentEvent.id, deck, [
            {
              live_difficulty_id: liveData.live_difficulty_id,
              is_random: !!liveData.random_flag,
              ac_flag: liveData.ac_flag,
              swing_flag: liveData.swing_flag
            }
          ], {
            score: totalScore,
            max_combo: this.params.max_combo,
            perfect_cnt: this.params.perfect_cnt,
            great_cnt: this.params.great_cnt,
            good_cnt: this.params.good_cnt,
            bad_cnt: this.params.bad_cnt,
            miss_cnt: this.params.miss_cnt
          })
        }
      }
      response.event_info = await this.eventStub.eventInfoWithRewards(this.user_id, currentEvent.id, currentEvent.name, this.params.event_point)
      response.event_info.event_point_info.before_event_point = userStatus.token_point
      response.event_info.event_point_info.after_event_point = userStatus.token_point
      if (!eventLive) {
        response.event_info.event_point_info.after_event_point = userStatus.token_point + this.params.event_point
        await this.connection.execute("UPDATE event_ranking SET token_point = token_point + :val WHERE user_id = :user AND event_id = :id", {
          val: this.params.event_point,
          user: this.user_id,
          id: currentEvent.id
        })
      }
    }
    return {
      status: 200,
      result: response
    }
  }
}
