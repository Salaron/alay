import assert from "assert"
import { Event } from "../../../common/event"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.STATIC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      party_user_id: TYPE.INT,
      unit_deck_id: TYPE.INT,
      live_difficulty_id: TYPE.STRING,
      lp_factor: TYPE.INT
    }
  }

  public paramCheck() {
    assert(!isNaN(parseInt(this.params.live_difficulty_id)), "live_difficulty_id is NaN")
    if (this.params.lp_factor < 1 || this.params.lp_factor > 4) throw new Error(`invalid lp_factor`)
  }

  public async execute() {
    const eventStatus = await this.event.getEventStatus(Event.getEventTypes().TOKEN)
    await this.connection.execute("DELETE FROM user_live_progress WHERE user_id = :user", {
      user: this.user_id
    })

    const guest = await this.connection.first(`
    SELECT units.unit_id FROM users
    JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5
    AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
    WHERE user_unit_deck.user_id=:user`, { user: this.params.party_user_id })

    let eventLive = false
    const liveInfo = await this.live.getLiveDataByDifficultyId(this.params.live_difficulty_id)
    if (liveInfo.capital_type === 2) { // token live
      if (!eventStatus.active) throw new ErrorAPI(3418, "ERROR_CODE_LIVE_EVENT_HAS_GONE")
      const eventLives = this.live.getMarathonLiveList(eventStatus.id)
      if (!eventLives.includes(liveInfo.live_difficulty_id)) throw new ErrorAPI(3418, "ERROR_CODE_LIVE_EVENT_HAS_GONE")
      const tokenCnt = await this.connection.first(`SELECT token_point FROM event_ranking WHERE user_id = :user AND event_id = :event`, {
        user: this.user_id,
        event: eventStatus.id
      })
      if (!tokenCnt || !tokenCnt.token_point || tokenCnt.token_point - this.params.lp_factor * liveInfo.capital_value < 0) throw new ErrorAPI(3412, "ERROR_CODE_LIVE_NOT_ENOUGH_EVENT_POINT")
      await this.connection.execute("UPDATE event_ranking SET token_point = token_point - :val WHERE user_id = :user AND event_id = :id", {
        val: this.params.lp_factor * liveInfo.capital_value,
        user: this.user_id,
        id: eventStatus.id
      })
      eventLive = true
    }

    const modsInt = await this.user.getModsInt(this.user_id)
    const [liveNotes, deckInfo] = await Promise.all([
      this.live.getLiveNotes(this.user_id, liveInfo, eventLive),
      this.live.getUserDeck(this.user_id, this.params.unit_deck_id, true, guest.unit_id),
      this.connection.query("INSERT INTO user_live_progress (user_id, live_difficulty_id, live_setting_id, deck_id, lp_factor, mods) VALUES (:user, :difficulty, :setting_id, :deck, :factor, :mods)", {
        user: this.user_id,
        difficulty: this.params.live_difficulty_id,
        setting_id: liveInfo.live_setting_id,
        deck: this.params.unit_deck_id,
        factor: this.params.lp_factor,
        mods: modsInt
      })
    ])

    if (liveNotes.mods.hp !== 0) deckInfo.total_hp = liveNotes.mods.hp
    const result = {
      rank_info: liveInfo.score_rank_info,
      energy_full_time: Utils.toSpecificTimezone(9),
      over_max_energy: 0,
      available_live_resume: true,
      live_list: [
        {
          live_info: {
            live_difficulty_id: liveInfo.live_difficulty_id,
            is_random: !!liveInfo.random_flag || liveNotes.mods.random,
            ac_flag: liveInfo.ac_flag,
            swing_flag: liveInfo.swing_flag,
            notes_list: liveNotes.liveNotes
          },
          deck_info: deckInfo
        }
      ],
      is_marathon_event: liveInfo.capital_type === 2 ? false : eventStatus.active,
      marathon_event_id: eventStatus.active ? eventStatus.id : undefined,
      no_skill: false,
      can_activate_effect: true
    }
    return {
      status: 200,
      result
    }
  }
}
