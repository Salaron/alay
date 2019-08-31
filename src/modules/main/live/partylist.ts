import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../core/requestData"
import { Live } from "../../../common/live"
import { Events } from "../../../common/event"
import { Utils } from "../../../common/utils"

const marathonDB = sqlite3.getMarathon()

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      live_difficulty_id: TYPE.STRING,
      lp_factor: TYPE.INT
    }
  }

  public paramCheck() {
    // check if this string contains integer value
    if (parseInt(this.params.live_difficulty_id) != parseInt(this.params.live_difficulty_id)) throw new Error(`live_difficulty_id is NaN`)
    if (this.params.lp_factor < 1 || this.params.lp_factor > 4) throw new Error(`invalid lp_factor`)
  }

  public async execute() {
    let liveData = await new Live(this.connection).getLiveDataByDifficultyId(this.params.live_difficulty_id)
    if (liveData.capital_type === 2) {
      let eventStatus = await new Events(this.connection).getEventStatus(Events.getEventTypes().TOKEN)
      if (!eventStatus.active) throw new ErrorCode(3418, "ERROR_CODE_LIVE_EVENT_HAS_GONE")
      let eventLives = Live.getMarathonLiveList(eventStatus.id)
      if (!eventLives.includes(liveData.live_difficulty_id)) throw new ErrorCode(3418, "ERROR_CODE_LIVE_EVENT_HAS_GONE")
      let tokenCnt = await this.connection.first(`SELECT token_point FROM event_ranking WHERE user_id = :user AND event_id = :event`, {
        user: this.user_id,
        event: eventStatus.id
      })
      if (!tokenCnt || !tokenCnt.token_point || tokenCnt.token_point - this.params.lp_factor * liveData.capital_value < 0) throw new ErrorCode(3412, "ERROR_CODE_LIVE_NOT_ENOUGH_EVENT_POINT")
    }

    let response: any = {
      has_slide_notes: liveData.swing_flag,
      party_list: [],
      training_energy: 5,
      training_energy_max: 5,
      server_timestamp: Utils.timeStamp()
    }

    // First: select 15 random friends
    let friendList = await this.connection.query(`
    SELECT DISTINCT
      users.user_id, users.name, users.level, 
      units.unit_owning_user_id,  unit_id, units.exp as unit_exp, units.next_exp, units.level as unit_level, units.max_level, 
      units.rank, units.max_rank, units.love, units.max_love, units.unit_skill_level, units.max_hp, units.favorite_flag, units.display_rank, units.unit_skill_exp, 
      units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool,
      (SELECT status FROM user_friend WHERE (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id) AND status = 1 LIMIT 1) as friend_status
    FROM users 
      JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
      JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id 
    WHERE users.user_id != :user
    HAVING friend_status = 1 
    ORDER BY RAND() 
    LIMIT 15`, { user: this.user_id })

    // select random users by level (currentUserLevel / 3)
    let rndUserCnt = 30 - friendList.length
    let rndUserList = await this.connection.query(`
    SELECT DISTINCT
      users.user_id, users.name, users.level, 
      units.unit_owning_user_id,  unit_id, units.exp as unit_exp, units.next_exp, units.level as unit_level, units.max_level, 
      units.rank, units.max_rank, units.love, units.max_love, units.unit_skill_level, units.max_hp, units.favorite_flag, units.display_rank, units.unit_skill_exp, 
      units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool,
      (SELECT status FROM user_friend WHERE (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id) AND status = 1) as friend_status
    FROM users 
      JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
      JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id 
    WHERE users.user_id != :user AND users.level > (SELECT level/3 FROM users WHERE user_id = :user)
    HAVING friend_status IS NULL 
    ORDER BY RAND() 
    LIMIT ${rndUserCnt}`, { user: this.user_id })

    // no users by level? ok, select random from all
    if (rndUserList.length === 0) rndUserList = await this.connection.query(`
    SELECT DISTINCT
      users.user_id, users.name, users.level, 
      units.unit_owning_user_id,  unit_id, units.exp as unit_exp, units.next_exp, units.level as unit_level, units.max_level, 
      units.rank, units.max_rank, units.love, units.max_love, units.unit_skill_level, units.max_hp, units.favorite_flag, units.display_rank, units.unit_skill_exp, 
      units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool,
      (SELECT status FROM user_friend WHERE (initiator_id = :user OR recipient_id = :user) AND (initiator_id = users.user_id OR recipient_id = users.user_id) AND status = 1) as friend_status
    FROM users 
      JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
      JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id 
    WHERE users.user_id != :user
    HAVING friend_status IS NULL 
    ORDER BY RAND() 
    LIMIT ${rndUserCnt}`, { user: this.user_id })

    // oh, you're alone? ok, select yourself lol
    if (rndUserList.length === 0 && friendList.length === 0) rndUserList = await this.connection.query(`
    SELECT 
      users.user_id, users.name, users.level, 
      units.unit_owning_user_id,  unit_id, units.exp as unit_exp, units.next_exp, units.level as unit_level, units.max_level, 
      units.rank, units.max_rank, units.love, units.max_love, units.unit_skill_level, units.max_hp, units.favorite_flag, units.display_rank, units.unit_skill_exp, 
      units.removable_skill_capacity, users.setting_award_id, units.attribute, units.stat_smile, units.stat_pure, units.stat_cool, 1 as friend_status 
    FROM users 
      JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
      JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id  AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id 
    WHERE users.user_id = :user`, { user: this.user_id })

    for (const friend of friendList) {
      response.party_list.push(this.parseUserInfo(friend))
    }
    for (const user of rndUserList) {
      response.party_list.push(this.parseUserInfo(user))
    }
    return {
      status: 200,
      result: response
    }
  }

  private parseUserInfo(data: any) {
    return {
      user_info: {
        user_id: data.user_id,
        name: data.name,
        level: data.level
      },
      center_unit_info: {
        unit_id: data.unit_id,
        love: data.love,
        level: data.unit_level,
        smile: data.stat_smile,
        cute: data.stat_pure,
        cool: data.stat_cool,
        rank: data.rank,
        display_rank: data.display_rank,
        is_rank_max: data.rank >= data.max_rank,
        is_love_max: data.love >= data.max_love,
        is_level_max: data.unit_level >= data.max_level,
        unit_skill_exp: data.unit_skill_exp,
        unit_removable_skill_capacity: data.removable_skill_capacity,
        max_hp: data.max_hp,
        removable_skill_ids: [],
        exp: data.unit_exp
      },
      setting_award_id: data.setting_award_id,
      available_social_point: 0,
      friend_status: data.friend_status || 0 // we can return only 0 or 1. other is not necessary
    }
  }
}