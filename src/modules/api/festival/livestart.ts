import assert from "assert"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const liveDB = sqlite3.getLiveDB()
const festDB = sqlite3.getFestivalDB()
interface bonusObject {
  bonus_id: number
  bonus_param: number
}
export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }
  public paramCheck() {
    return (
      Type.isInt(this.params.unit_deck_id) && this.params.unit_deck_id > 0 && this.params.unit_deck_id <= 18 &&
      Type.isArray(this.params.event_festival_item_ids) &&
      Type.isBoolean(this.params.pause_assist) && Type.isBoolean(this.params.is_skill_on)
    )
  }

  public async execute() {
    const currentEvent = await this.event.getEventById(this.params.event_id)
    if (currentEvent.active === false) throw new ErrorAPI(720)

    let session = await this.connection.first("SELECT * FROM event_festival_users WHERE user_id = :user AND event_id = :event", {
      user: this.user_id,
      event: currentEvent.id
    })
    if (!session) throw new Error("There is no active festival session")
    await this.connection.execute("DELETE FROM user_live_progress WHERE user_id = :user", {
      user: this.user_id
    })

    const units = await this.live.getUserDeck(this.user_id, this.params.unit_deck_id, true)
    const modsInt = await this.user.getModsInt(this.user_id)

    const bonusList: bonusObject[] = await Promise.all(this.params.event_festival_item_ids.map(async (itemId: number) => {
      if (!Type.isInt(itemId)) throw new Error(`Expected int, but got ${typeof itemId} (itemId)`)

      const bonus = await festDB.get("SELECT bonus_id, bonus_param, cost_type, cost_value FROM event_festival_item_m WHERE event_festival_item_id = :itemId", {
        itemId
      })
      let costItemName = ""
      if (bonus.cost_type === 3) costItemName = "game_coin"
      else if (bonus.cost_type === 4) costItemName = "sns_coin"
      else throw new Error("Unsupported item cost")

      this.item.addItemToUser(this.user_id, {
        name: costItemName
      }, 0 - bonus.cost_value)
      return {
        bonus_id: bonus.bonus_id,
        bonus_param: bonus.bonus_param > 100 ? Math.floor(bonus.bonus_param / 100) : bonus.bonus_param
      }
    }))

    const trackIds: number[] = session.track_ids.split(",").map(Number)
    const difficultyIds: number[] = session.difficulty_ids.split(",").map(Number)
    assert(difficultyIds.length === trackIds.length)
    const rankScore = {
      c_rank_score: 0,
      b_rank_score: 0,
      a_rank_score: 0,
      s_rank_score: 0
    }
    const liveList = await Promise.all(trackIds.map(async (trackId, i) => {
      const liveInfo = await liveDB.get(`
      SELECT
        swing_flag, ac_flag, difficulty, live_setting_id, attribute_icon_id as attribute,
        live_track_m.live_track_id, member_category, notes_setting_asset,
        c_rank_score, b_rank_score, a_rank_score, s_rank_score
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
      const liveNotes = await this.live.getLiveNotes(this.user_id, liveInfo, true)
      rankScore.c_rank_score += liveInfo.c_rank_score
      rankScore.b_rank_score += liveInfo.b_rank_score
      rankScore.a_rank_score += liveInfo.a_rank_score
      rankScore.s_rank_score += liveInfo.s_rank_score
      return {
        live_info: {
          live_difficulty_id: liveInfo.live_difficulty_id,
          live_setting_id: liveInfo.live_setting_id,
          is_random: liveInfo.difficulty === 5 || liveNotes.mods.random,
          ac_flag: liveInfo.ac_flag || 0,
          swing_flag: liveInfo.swing_flag || 0,
          notes_list: liveNotes.liveNotes
        },
        deck_info: {
          ...units,
          prepared_hp_damage: 0
        },
        item_bonus_list: bonusList
      }
    }))

    let result = {
      rank_info: this.live.generateRankInfo(rankScore, "score"),
      energy_full_time: "2019-04-01 00:00:00",
      over_max_energy: 0,
      available_live_resume: true,
      live_list: liveList,
      encore_live_list: [],
      can_activate_effect: true,
      no_skill: this.params.is_skill_on === false
    }

    await Promise.all([
      this.connection.query(`INSERT INTO user_live_progress (
        user_id, live_difficulty_id, live_setting_id, deck_id, lp_factor, mods, event_id
      ) VALUES (:user, :difficulty, :setting_id, :deck, 1, :mods, :event)`, {
        user: this.user_id,
        difficulty: result.live_list[0].live_info.live_difficulty_id,
        setting_id: result.live_list[0].live_info.live_setting_id,
        deck: this.params.unit_deck_id,
        mods: modsInt,
        event: currentEvent.id
      }),
      this.connection.query("UPDATE event_festival_users SET bonus_ids = :ids WHERE user_id = :user AND event_id = :event", {
        event: currentEvent.id,
        user: this.user_id,
        ids: this.params.event_festival_item_ids.join(",")
      })
    ])

    return {
      status: 200,
      result
    }
  }
}
