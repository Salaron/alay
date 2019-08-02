import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import assert from "assert"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
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
    const user = new User(this.connection)
    const live = new Live(this.connection)
    const item = new Item(this.connection)
    const event = new Events(this.connection)
    const totalScore = this.params.score_smile + this.params.score_cute + this.params.score_cool
    let eventLive = false

    // check if live session is active
    let session = await this.connection.first("SELECT * FROM user_live_progress WHERE user_id = :user", { user: this.user_id })
    if (!session) throw new ErrorCode(3411, "ERROR_CODE_LIVE_PLAY_DATA_NOT_FOUND")

    let currentEvent = await event.getEventStatus(Events.getEventTypes().TOKEN)
    if (currentEvent.active && Live.getMarathonLiveList(currentEvent.id).includes(this.params.live_difficulty_id)) eventLive = true

    let beforeUserInfo = await user.getUserInfo(this.user_id)
    let liveData = await live.getLiveDataByDifficultyId(this.params.live_difficulty_id)
    let maxKizuna = Live.calculateMaxKizuna(liveData.s_rank_combo)
    if (this.params.love_cnt > maxKizuna) throw new ErrorUser(`Overflow kizuna (max: ${maxKizuna}, provided: ${this.params.love_cnt})`, this.user_id)
    let deck = (await live.getUserDeck(this.user_id, session.deck_id, false, undefined, true)).deck
    // TODO: apply kizuna bonus

    await this.connection.execute(`INSERT INTO user_live_status VALUES (:user, :diff, :setting, 2, :score,:combo, clear_cnt + 1) 
    ON DUPLICATE KEY UPDATE clear_cnt=clear_cnt + 1`, {
      user: this.user_id,
      setting: session.live_setting_id,
      score: totalScore,
      combo: this.params.max_combo,
      diff: session.live_difficulty_id
    })
    let liveStatus = await this.connection.first(`SELECT hi_score, hi_combo, clear_cnt FROM user_live_status WHERE user_id=:user AND live_difficulty_id = :ldid`, {
      user: this.user_id,
      ldid: this.params.live_difficulty_id
    })

    let hi_score = Math.max(liveStatus.hi_score, totalScore)
    let max_combo = Math.max(liveStatus.hi_combo, this.params.max_combo)
    await this.connection.execute(`UPDATE user_live_status SET hi_score = :score, hi_combo = :combo WHERE user_id = :user AND live_difficulty_id = :ldid`, {
      score: hi_score,
      combo: max_combo,
      user: this.user_id,
      ldid: this.params.live_difficulty_id
    })

    let scoreRank = Live.getRank(liveData.score_rank_info, totalScore)
    let comboRank = Live.getRank(liveData.combo_rank_info, this.params.max_combo)
    let completeRank = Live.getRank(liveData.complete_rank_info, liveStatus.clear_cnt)
    let goalAccomp = await live.liveGoalAccomp(this.user_id, this.params.live_difficulty_id, scoreRank, comboRank, completeRank)

    let exp = Live.getExpAmount(liveData.difficulty)
    if (scoreRank === 5) exp = Math.floor(exp / 2)
    let nextLevelInfo = await user.addExp(this.user_id, exp)
    await item.addPresent(this.user_id, {
      name: "coins",
    }, "Live Show! Reward", 150000, true)
    let afterUserInfo = await user.getUserInfo(this.user_id)
    let response = {
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
        game_coin: 150000,
        game_coin_reward_box_flag: false,
        social_point: 0
      },
      reward_unit_list: {
        live_clear: [],
        live_rank: [],
        live_combo: []
      },
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
      daily_reward_info: [],
      //can_send_friend_request: false,
      unit_support_list: await user.getSupportUnits(this.user_id),
      unite_info: [],
      class_system: User.getClassSystemStatus(this.user_id)
    }

    await this.connection.query(`DELETE FROM user_live_progress WHERE user_id = :user`, { user: this.user_id })
    if (currentEvent.active) {
      if (eventLive) {
        this.params.event_point = Events.getTokenEventPoint(liveData.difficulty, comboRank, scoreRank) * session.lp_factor
      }
      let userStatus = await this.connection.first(`SELECT token_point, score FROM event_ranking WHERE user_id = :user AND event_id = :event`, {
        user: this.user_id,
        event: currentEvent.id
      })
      response.event_info = await event.eventInfoWithRewards(this.user_id, currentEvent.id, currentEvent.name, this.params.event_point)
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

      if (!userStatus.score || userStatus.score < totalScore) {
        await event.writeHiScore(this.user_id, currentEvent.id, deck, [
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
    return {
      status: 200,
      result: response
    }
  }
}