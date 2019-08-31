import { Utils } from "./utils"
import { Connection } from "../core/database_wrappers/mysql"
import { Item } from "./item"
import { Unit } from "./unit"

const eventDB = sqlite3.getEvent()

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
const tokenEventPoint = [ // format: [difficulty][comboRank][scoreRank]
  [ // none
  ],
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

export class Events {
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async getEventStatus(type: eventType): Promise<eventStatus> {
    let res = await this.connection.first("SELECT event_id, name, start_date, end_date, close_date, open_date, open_date, close_date FROM events_list WHERE event_category_id = :type ORDER BY close_date DESC", {
      type: type
    })
    if (!res) return {
      opened: false,
      active: false,
      id: 0,
      name: "",
      open_date: "0000-00-00 00:00:00",
      close_date: "0000-00-00 00:00:00"
    }
    let currDate = Utils.toSpecificTimezone(9)
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
    let res = await this.connection.first("SELECT event_id, name, start_date, end_date, close_date, open_date FROM events_list WHERE event_id = :id", {
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
    let currDate = Utils.toSpecificTimezone(9)

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
    let res = await this.connection.first("SELECT event_point, FIND_IN_SET(event_point, (SELECT GROUP_CONCAT( event_point ORDER BY event_point DESC) FROM event_ranking WHERE event_id=:event)) AS 'event_rank' FROM event_ranking WHERE user_id=:user AND event_id=:event AND event_point > 0", {
      user: userId,
      event: eventId
    })
    if (!res) return {
      event_point: 0,
      event_rank: 0
    }
    return res
  }

  public async eventInfoWithRewards(userId: number, eventId: number, eventName: string, addedEventPoint: number, base?: number) {
    const item = new Item(this.connection)
    const userStatus = await new Events(this.connection).getEventUserStatus(userId, eventId)
    let eventRewardInfo: any[] = []
    let nextEventRewardInfo = {
      event_point: 0,
      rewards: <any[]>[]
    }

    let eventPointReward = await eventDB.all(`
    SELECT point_count, add_type, item_id, amount, item_category_id FROM event_point_count_m 
    INNER JOIN event_point_count_reward_m ON event_point_count_m.event_point_count_id = event_point_count_reward_m.event_point_count_id 
    WHERE event_id = ${eventId} AND point_count > ${userStatus.event_point + addedEventPoint}`)

    await this.connection.execute("INSERT INTO event_ranking (user_id, event_id, event_point, lives_played) VALUES (:user, :eventId, :point, 1) ON DUPLICATE KEY UPDATE event_point=event_point + :point, lives_played = lives_played + 1", {
      point: addedEventPoint,
      eventId: eventId,
      user: userId
    })

    for (const reward of eventPointReward) {
      if (reward.point_count < userStatus.event_point + addedEventPoint) {
        try {
          await item.addPresent(userId, {
            id: reward.item_id,
            type: reward.add_type
          }, `"${eventName}" reward`, reward.amount, reward.add_type != 1001)
          eventRewardInfo.push({
            item_id: reward.item_id,
            add_type: reward.add_type,
            amount: reward.amount,
            item_category_id: reward.item_category_id,
            reward_box_flag: reward.add_type == 1001, // cards should be added to reward box
            required_event_point: reward.point_count
          })
        } catch (_) { } // unsupported type
      } else {
        nextEventRewardInfo.event_point = reward.point_count
        nextEventRewardInfo.rewards.push({
          item_id: reward.item_id,
          add_type: reward.add_type,
          amount: reward.amount,
          item_category_id: reward.item_category_id
        })

        return {
          event_id: eventId,
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
    }
  }

  public async writeHiScore(userId: number, eventId: number, deck: any, liveList: liveInfo[], scoreInfo: scoreInfo) {
    let json = {
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

    for (const unit of deck) {
      // total score for deck
      json.deck.total_status.smile += unit.stat_smile
      json.deck.total_status.cute += unit.stat_pure
      json.deck.total_status.cool += unit.stat_cool
      json.deck.total_status.hp += unit.max_hp
      // center bonus for deck
      json.deck.center_bonus.smile += unit.center_bonus_smile
      json.deck.center_bonus.cute += unit.center_bonus_pure
      json.deck.center_bonus.cool += unit.center_bonus_cool
      // sis bonus for deck
      json.deck.si_bonus.smile += unit.bonus_smile
      json.deck.si_bonus.cute += unit.bonus_pure
      json.deck.si_bonus.cool += unit.bonus_cool
      // sis data for unit
      unit.removable_skill_ids = await new Unit(this.connection).getUnitSiS(unit.unit_owning_user_id)
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
      // remove some shit
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

      json.deck.units.push(unit)
    }

    await this.connection.query(`INSERT INTO event_ranking (user_id, event_id, event_point, score, deck) VALUES (:user, :event, 0, :score, :deck) ON DUPLICATE KEY UPDATE score = :score, deck = :deck`, {
      user: userId,
      event: eventId,
      score: json.score_info.score,
      deck: JSON.stringify(json)
    })
  }

  public static getEventTypes() {
    return eventType
  }
  public static getTokenEventPoint(liveDifficulty: number, comboRank: number, scoreRank: number) {
    return tokenEventPoint[liveDifficulty][comboRank][scoreRank]
  }
}