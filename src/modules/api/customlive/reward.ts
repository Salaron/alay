import { TYPE } from "../../../common/type"
import { User } from "../../../common/user"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

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
      customLive: TYPE.BOOLEAN
    }
  }

  public async execute() {
    const totalScore = this.params.score_smile + this.params.score_cute + this.params.score_cool

    // check if live session is active
    const session = await this.connection.first("SELECT * FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    if (!session || session.live_difficulty_id !== this.params.live_difficulty_id || session.live_setting_id)
      throw new ErrorAPI(3411, "ERROR_CODE_LIVE_PLAY_DATA_NOT_FOUND")

    let [beforeUserInfo, liveData, liveStatus, deck] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.live.getCustomLiveData(this.params.live_difficulty_id),
      this.connection.first(`
      SELECT
        hi_score, hi_combo, complete_cnt
      FROM
        user_custom_live_status
      WHERE user_id = :user AND custom_live_id = :liveId`, {
        user: this.user_id,
        liveId: this.params.live_difficulty_id
      }),
      this.live.getUserDeck(this.user_id, session.deck_id, false, null, true)
    ])
    if (!liveStatus) liveStatus = {
      hi_score: 0,
      hi_combo: 0,
      complete_cnt: 0
    }

    const maxKizuna = this.live.calculateMaxKizuna(liveData.s_rank_combo)
    if (this.params.love_cnt > maxKizuna)
      throw new Error(`Too much kizuna (max: ${maxKizuna}, provided: ${this.params.love_cnt})`)
    await this.live.applyKizunaBonusToDeck(this.user_id, deck.deck!, this.params.love_cnt)

    const units = deck.deck
    const hiScore = Math.max(totalScore, liveStatus.hi_score)
    const hiScoreRank = this.live.getRank(liveData.score_rank_info, hiScore)
    const maxCombo = Math.max(this.params.max_combo, liveStatus.hi_combo)
    const maxComboRank = this.live.getRank(liveData.combo_rank_info, maxCombo)

    const scoreRank = this.live.getRank(liveData.score_rank_info, totalScore)
    const comboRank = this.live.getRank(liveData.combo_rank_info, this.params.max_combo)
    const completeRank = this.live.getRank(liveData.complete_rank_info, liveStatus.complete_cnt + 1)
    await this.connection.execute(`INSERT INTO user_custom_live_status (
      user_id, custom_live_id, hi_score, hi_combo,
      complete_rank, combo_rank, score_rank, status, complete_cnt
    ) VALUES (
      :userId, :liveId, :hiScore, :maxCombo,
      :completeRank, :maxComboRank, :hiScoreRank, 2, 1
    ) ON DUPLICATE KEY UPDATE
    complete_cnt = complete_cnt + 1, hi_score = :hiScore, hi_combo = :maxCombo,
    complete_rank = :completeRank, combo_rank = :maxComboRank, score_rank = :hiScoreRank
    `, {
      userId: this.user_id,
      liveId: session.live_difficulty_id,
      hiScore, maxCombo,
      completeRank, maxComboRank, hiScoreRank
    })

    let exp = this.live.getExpAmount(liveData.difficulty)
    if (scoreRank === 5) exp = Math.floor(exp / 2)
    const [nextLevelInfo, defaultRewards, afterUserInfo, unitSupportList] = await Promise.all([
      this.user.addExp(this.user_id, exp),
      this.live.getDefaultRewards(this.user_id, scoreRank, comboRank, session.mods),
      this.user.getUserInfo(this.user_id),
      this.user.getSupportUnits(this.user_id)
    ])

    const result = {
      live_info: [
        {
          live_difficulty_id: session.live_difficulty_id,
          is_random: !!liveData.random_flag,
          ac_flag: liveData.ac_flag,
          swing_flag: liveData.swing_flag
        }
      ],
      rank: scoreRank,
      combo_rank: comboRank,
      total_love: this.params.love_cnt,
      is_high_score: totalScore >= liveStatus.hi_score,
      hi_score: Math.max(totalScore, liveStatus.hi_score),
      base_reward_info: await this.live.getBaseRewardInfo(beforeUserInfo, afterUserInfo, exp, 100000),
      reward_unit_list: defaultRewards.reward_unit_list,
      unlocked_subscenario_ids: [],
      effort_point: [],
      is_effort_point_visible: false,
      limited_effort_box: [],
      unit_list: units,
      before_user_info: beforeUserInfo,
      after_user_info: afterUserInfo,
      next_level_info: nextLevelInfo,
      goal_accomp_info: {
        achieved_ids: [],
        rewards: []
      },
      special_reward_info: [],
      event_info: <any>[],
      daily_reward_info: defaultRewards.daily_reward_info,
      can_send_friend_request: false,
      unit_support_list: unitSupportList,
      unite_info: [],
      class_system: User.getClassSystemStatus(this.user_id)
    }

    /* await this.live.writeToLog(this.user_id, {
      live_setting_id: liveData.live_setting_id,
      is_event: false,
      score: totalScore,
      combo: this.params.max_combo,
      combo_rank: comboRank,
      score_rank: scoreRank,
      mods: session.mods
    }) */
    await this.connection.query(`DELETE FROM user_live_progress WHERE user_id = :user`, { user: this.user_id })
    return {
      status: 200,
      result
    }
  }
}
