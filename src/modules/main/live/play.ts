import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"
import assert from "assert"

const liveDB = sqlite3.getLive()

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
      party_user_id: TYPE.INT,
      unit_deck_id: TYPE.INT,
      live_difficulty_id: TYPE.STRING
    }
  }
  public paramCheck() {
    assert(!isNaN(parseInt(this.params.live_difficulty_id)), "live_difficulty_id is NaN")
  }

  public async execute() {
    const live = new Live(this.connection)
    // clear data about any previous live session
    await this.connection.query("DELETE FROM user_live_progress WHERE user_id=:user", { user: this.user_id })
    let guest = await this.connection.first(`
    SELECT units.unit_id FROM users  
    JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id 
    JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 
    AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id 
    JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id 
    WHERE user_unit_deck.user_id=:user`, { user: this.params.party_user_id })


    let liveInfo = await live.getLiveDataByDifficultyId(this.params.live_difficulty_id)
    let liveNotes = await live.getLiveNotes(this.user_id, liveInfo.live_setting_id)
    let deckInfo = await live.getUserDeck(this.user_id, this.params.unit_deck_id, true, guest.unit_id)

    await this.connection.query("INSERT INTO user_live_progress (user_id, live_difficulty_id, live_setting_id, deck_id) VALUES (:user, :difficulty, :setting_id, :deck)", {
      user: this.user_id,
      difficulty: this.params.live_difficulty_id,
      setting_id: liveInfo.live_setting_id,
      deck: this.params.unit_deck_id
    })
    let response = {
      rank_info: [
        { rank: 5, rank_min: 0, rank_max: liveInfo.c_rank_score - 1 },
        { rank: 4, rank_min: liveInfo.c_rank_score, rank_max: liveInfo.b_rank_score - 1 },
        { rank: 3, rank_min: liveInfo.b_rank_score, rank_max: liveInfo.a_rank_score - 1 },
        { rank: 2, rank_min: liveInfo.a_rank_score, rank_max: liveInfo.s_rank_score - 1 },
        { rank: 1, rank_min: liveInfo.s_rank_score, rank_max: 0 },
      ],
      energy_full_time: Utils.toSpecificTimezone(9),
      over_max_energy: 0,
      available_live_resume: true,
      live_list: [
        {
          live_info: {
            live_difficulty_id: liveInfo.live_difficulty_id,
            is_random: false,
            ac_flag: liveInfo.ac_flag,
            swing_flag: liveInfo.swing_flag,
            notes_list: liveNotes
          },
          deck_info: deckInfo
        }
      ],
      is_marathon_event: false,
      no_skill: false,
      can_activate_effect: true
    }
    return {
      status: 200,
      result: response
    }
  }
}