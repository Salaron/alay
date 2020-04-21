import { BaseAction } from "../models/actions"
import { Utils } from "./utils"
import { CommonModule } from "../models/common"

const eventDB = sqlite3.getEventCommonDB()

export enum eventType {
  TOKEN = 1,
  BATTLE = 2,
  FESTIVAL = 3,
  CHALLENGE = 4,
  QUEST = 5,
  DUTY = 6
}
export interface eventStatus {
  opened: boolean
  active: boolean
  id: number
  name: string
  close_date: string
  open_date: string
}
export interface eventUserStatus {
  event_point: number
  event_rank: number
}

export class Event extends CommonModule {

  public static getEventTypes() {
    return eventType
  }
  public TYPES = eventType
  constructor(action: BaseAction) {
    super(action)
  }

  public async getEventStatus(type: eventType): Promise<eventStatus> {
    const res = await this.connection.first("SELECT event_id, name, start_date, end_date, close_date, open_date, open_date, close_date FROM events_list WHERE event_category_id = :type ORDER BY close_date DESC", {
      type
    })
    if (!res) return {
      opened: false,
      active: false,
      id: 0,
      name: "",
      open_date: "0000-00-00 00:00:00",
      close_date: "0000-00-00 00:00:00"
    }
    const currDate = Utils.toSpecificTimezone(9)
    return {
      opened: res.close_date > currDate && res.open_date < currDate,
      active: (res.end_date > currDate && res.start_date < currDate) && (res.close_date > currDate && res.open_date < currDate),
      id: res.event_id,
      name: res.name,
      open_date: res.open_date,
      close_date: res.close_date
    }
  }
  public async getEventById(eventId: number): Promise<eventStatus> {
    const res = await this.connection.first("SELECT event_id, name, start_date, end_date, close_date, open_date FROM events_list WHERE event_id = :id", {
      id: eventId
    })
    if (!res) return {
      opened: false,
      active: false,
      id: 0,
      name: "",
      open_date: "0000-00-00 00:00:00",
      close_date: "0000-00-00 00:00:00"
    }
    const currDate = Utils.toSpecificTimezone(9)

    return {
      opened: res.close_date > currDate && res.open_date < currDate,
      active: (res.end_date > currDate && res.start_date < currDate) && (res.close_date > currDate && res.open_date < currDate),
      id: res.event_id,
      name: res.name,
      open_date: res.open_date,
      close_date: res.close_date
    }
  }

  public async getEventUserStatus(userId: number, eventId: number): Promise<eventUserStatus> {
    const res = await this.connection.first("SELECT event_point, FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) AS 'event_rank' FROM event_ranking WHERE user_id=:user AND event_id=:event AND event_point > 0", {
      user: userId,
      event: eventId
    })
    if (!res) return {
      event_point: 0,
      event_rank: 0
    }
    return res
  }

  public async eventInfoWithRewards(userId: number, event: eventStatus, addedEventPoint: number, base?: number) {
    const userStatus = await this.getEventUserStatus(userId, event.id)
    const eventRewardInfo: any[] = []
    const nextEventRewardInfo = {
      event_point: 0,
      rewards: <any[]>[]
    }

    const eventPointRewards = await eventDB.all(`
    SELECT
      point_count, add_type, item_id, amount, item_category_id
    FROM
      event_point_count_m as point
    INNER JOIN
      event_point_count_reward_m as reward ON point.event_point_count_id = reward.event_point_count_id
    WHERE
      event_id = :eventId AND point_count > :pointCount
    `, {
      eventId: event.id,
      pointCount: userStatus.event_point
    })

    await this.connection.execute(`
    INSERT INTO
      event_ranking (user_id, event_id, event_point, lives_played)
    VALUES (:userId, :eventId, :addedEventPoint, 0) ON DUPLICATE KEY UPDATE
      event_point=event_point + :addedEventPoint
    `, {
      addedEventPoint,
      eventId: event.id,
      userId
    })

    for (const reward of eventPointRewards) {
      if (reward.point_count < userStatus.event_point + addedEventPoint) {
        try {
          await this.action.item.addPresent(userId, {
            id: reward.item_id,
            type: reward.add_type
          }, `"${event.name}" Event Point Reward`, reward.amount, reward.add_type !== 1001)
          eventRewardInfo.push({
            item_id: reward.item_id,
            add_type: reward.add_type,
            amount: reward.amount,
            item_category_id: reward.item_category_id,
            reward_box_flag: reward.add_type === 1001, // cards should be added to reward box
            required_event_point: reward.point_count
          })
        } catch {
          // unsupported type
        }
      } else {
        nextEventRewardInfo.event_point = reward.point_count
        nextEventRewardInfo.rewards.push({
          item_id: reward.item_id,
          add_type: reward.add_type,
          amount: reward.amount,
          item_category_id: reward.item_category_id
        })
        break
      }
    }

    return {
      event_id: event.id,
      event_point_info: {
        before_event_point: userStatus.event_point,
        before_total_event_point: userStatus.event_point,
        after_event_point: userStatus.event_point + addedEventPoint,
        after_total_event_point: userStatus.event_point + addedEventPoint,
        base_event_point: base,
        added_event_point: addedEventPoint
      },
      event_reward_info: eventRewardInfo,
      next_event_reward_info: nextEventRewardInfo,
      event_notice: []
    }
  }

  public async writeHiScore(userId: number, eventId: number, deck: any, liveList: liveInfo[], scoreInfo: scoreInfo) {
    let userDeck = Utils.createObjCopy(deck) // protect original deck
    let jsonResult = {
      live_list: liveList,
      score_info: scoreInfo,
      deck: {
        total_status: {
          hp: 0,
          smile: 0,
          cute: 0,
          cool: 0
        },
        center_bonus: {
          hp: 0,
          smile: 0,
          cute: 0,
          cool: 0
        },
        si_bonus: {
          hp: 0,
          smile: 0,
          cute: 0,
          cool: 0
        },
        units: <any>[]
      }
    }

    for (const unit of userDeck) {
      // total score for deck
      jsonResult.deck.total_status.smile += unit.stat_smile
      jsonResult.deck.total_status.cute += unit.stat_pure
      jsonResult.deck.total_status.cool += unit.stat_cool
      jsonResult.deck.total_status.hp += unit.max_hp
      // center bonus for deck
      jsonResult.deck.center_bonus.smile += unit.center_bonus_smile
      jsonResult.deck.center_bonus.cute += unit.center_bonus_pure
      jsonResult.deck.center_bonus.cool += unit.center_bonus_cool
      // sis bonus for deck
      jsonResult.deck.si_bonus.smile += unit.bonus_smile
      jsonResult.deck.si_bonus.cute += unit.bonus_pure
      jsonResult.deck.si_bonus.cool += unit.bonus_cool
      // sis data for unit
      unit.removable_skill_ids = await this.action.unit.getUnitSiS(unit.unit_owning_user_id)
      // total score for unit
      unit.total_status = {
        hp: unit.max_hp,
        smile: unit.stat_smile,
        cute: unit.stat_pure,
        cool: unit.stat_cool
      }
      // sis bonus for unit
      unit.si_bonus = {
        hp: 0,
        smile: unit.bonus_smile,
        cute: unit.bonus_pure,
        cool: unit.bonus_cool
      }
      // remove temporary shit
      unit.unit_owning_user_id = undefined
      unit.stat_smile = undefined
      unit.stat_pure = undefined
      unit.stat_cool = undefined
      unit.center_bonus_smile = undefined
      unit.center_bonus_pure = undefined
      unit.center_bonus_cool = undefined
      unit.bonus_smile = undefined
      unit.bonus_pure = undefined
      unit.bonus_cool = undefined
      unit.before_love = undefined
      unit.attribute = undefined
      unit.max_love = undefined
      unit.max_skill_level = undefined

      jsonResult.deck.units.push(unit)
    }

    await this.connection.query(`INSERT INTO event_ranking (user_id, event_id, event_point, score, deck) VALUES (:user, :event, 0, :score, :deck) ON DUPLICATE KEY UPDATE score = :score, deck = :deck`, {
      user: userId,
      event: eventId,
      score: jsonResult.score_info.score,
      deck: JSON.stringify(jsonResult)
    })
  }

  public async getDutyMatchingUsers(roomId: number, eventId: number) {
    let users = await this.connection.query(`
      SELECT
        event_duty_users.user_id, name, users.level, units.unit_id, units.love, units.max_love,
        units.level as unit_level, units.max_level, units.stat_smile, units.stat_pure,
        units.stat_cool, units.rank, units.max_rank, units.display_rank,
        units.unit_skill_exp, units.removable_skill_capacity,
        chat_id, event_duty_users.deck_id AS selected_deck, deck_mic, event_point, setting_award_id,
        FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) AS rank
      FROM event_duty_users
      JOIN users ON event_duty_users.user_id = users.user_id JOIN user_unit_deck ON users.user_id=user_unit_deck.user_id AND users.main_deck=user_unit_deck.unit_deck_id
      JOIN user_unit_deck_slot ON user_unit_deck.unit_deck_id AND user_unit_deck_slot.slot_id=5 AND user_unit_deck_slot.user_id=users.user_id AND users.main_deck=user_unit_deck_slot.deck_id
      JOIN units ON user_unit_deck_slot.unit_owning_user_id=units.unit_owning_user_id
      JOIN event_ranking ON event_ranking.user_id = event_duty_users.user_id
      WHERE room_id = :room AND event_id = :event AND event_duty_users.status = 1 ORDER BY event_duty_users.insert_date_ms ASC`, { room: roomId, event: eventId })

    let result = users.map(user => {
      return {
        user_info: {
          user_id: user.user_id,
          name: user.name,
          level: user.level,
        },
        event_status: {
          total_event_point: user.event_point,
          event_rank: user.rank
        },
        center_unit_info: {
          unit_id: user.unit_id,
          love: user.love,
          level: user.unit_level,
          smile: user.stat_smile,
          cute: user.stat_pure,
          cool: user.stat_cool,
          rank: user.rank,
          display_rank: user.display_rank,
          is_rank_max: user.rank >= user.max_rank,
          is_love_max: user.love >= user.max_love,
          is_level_max: user.unit_level >= user.max_level,
          unit_skill_exp: user.unit_skill_exp,
          unit_removable_skill_capacity: user.removable_skill_capacity,
          removable_skill_ids: []
        },
        setting_award_id: user.setting_award_id,
        chat_id: user.chat_id,
        room_user_status: {
          has_selected_deck: user.selected_deck != null,
          event_team_duty_base_point: user.deck_mic || 0
        }
      }
    })
    return result
  }
  public getTokenEventPoint(liveDifficulty: number, comboRank: number, scoreRank: number) {
    // Source: https://decaf.kouhi.me/lovelive/index.php/Gameplay#Token_Collecting_Event
    const tokenEventPoint = [ // format: [difficulty][comboRank][scoreRank]
      null,
      [ // easy
        // None, S, A, B, C, D rank score
        [],                      // None
        [0, 71, 70, 68, 64, 62], // S rank combo
        [0, 70, 68, 66, 63, 61], // A rank combo
        [0, 69, 66, 65, 62, 60], // B rank combo
        [0, 67, 65, 64, 61, 59], // C rank combo
        [0, 66, 64, 63, 60, 57]  // D rank combo
      ],
      [ // normal
        [],
        [0, 148, 143, 137, 131, 124],
        [0, 145, 140, 135, 128, 122],
        [0, 143, 137, 132, 126, 120],
        [0, 140, 135, 129, 123, 117],
        [0, 137, 133, 125, 121, 114]
      ],
      [ // hard
        [],
        [0, 261, 249, 237, 226, 214],
        [0, 254, 242, 231, 219, 207],
        [0, 246, 235, 224, 213, 202],
        [0, 241, 230, 220, 209, 197],
        [0, 237, 226, 215, 204, 194]
      ],
      [ // expert
        [],
        [0, 565, 540, 509, 484, 459],
        [0, 549, 525, 495, 470, 446],
        [0, 518, 495, 467, 444, 421],
        [0, 508, 485, 458, 435, 413],
        [0, 498, 475, 448, 426, 403]
      ]
    ]

    return tokenEventPoint[liveDifficulty]![comboRank][scoreRank]
  }

  public calcClearKeys(seed: number, liveDifficultyId: number, smile: number, pure: number, cool: number, maxCombo: number, loveCnt: number) {
    let key = seed % 7927
    let values = [
      liveDifficultyId,
      smile,
      pure,
      cool,
      maxCombo,
      loveCnt,
      0
    ].map((value) => {
      value = Math.floor(value) + key
      key = value % 7927
      return value
    })
    return Utils.hashSHA1(`*${seed}*0*${values.join("*")}*`).toUpperCase()
  }
}
