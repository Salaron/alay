import assert from "assert"
import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

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
      lp_factor: TYPE.INT,
      customLive: TYPE.BOOLEAN
    }
  }

  public paramCheck() {
    assert(!isNaN(parseInt(this.params.live_difficulty_id)), "live_difficulty_id is NaN")
    if (this.params.lp_factor < 1 || this.params.lp_factor > 4) throw new Error(`invalid lp_factor`)
  }

  public async execute() {
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

    const liveData = await this.live.getCustomLiveData(this.params.live_difficulty_id)

    const modsInt = await this.user.getModsInt(this.user_id)
    const [liveNotes, deckInfo] = await Promise.all([
      this.live.getLiveNotes(this.user_id, liveData),
      this.live.getUserDeck(this.user_id, this.params.unit_deck_id, true, guest.unit_id),
      this.connection.query("INSERT INTO user_live_progress (user_id, live_difficulty_id, live_setting_id, deck_id, lp_factor, mods) VALUES (:user, :difficultyId, :settingId, :deck, :factor, :mods)", {
        user: this.user_id,
        difficultyId: this.params.live_difficulty_id,
        settingId: null,
        deck: this.params.unit_deck_id,
        factor: this.params.lp_factor,
        mods: modsInt
      })
    ])

    if (liveNotes.mods.hp !== 0) deckInfo.total_hp = liveNotes.mods.hp
    const result = {
      rank_info: liveData.score_rank_info,
      energy_full_time: Utils.toSpecificTimezone(9),
      over_max_energy: 0,
      available_live_resume: true,
      live_list: [
        {
          live_info: {
            live_difficulty_id: liveData.live_difficulty_id,
            is_random: !!liveData.random_flag || liveNotes.mods.random,
            ac_flag: liveData.ac_flag,
            swing_flag: liveData.swing_flag,
            notes_list: liveNotes.liveNotes
          },
          deck_info: deckInfo
        }
      ],
      is_marathon_event: false,
      no_skill: false,
      can_activate_effect: true,
      custom_live: true
    }
    return {
      status: 200,
      result
    }
  }
}
