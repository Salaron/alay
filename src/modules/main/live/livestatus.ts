import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { eventStatus, Events } from "../../../common/event"
import { Live } from "../../../common/live"

const normalLiveUnlock = [
  1, 2, 3, 350,
  1197, 1190, 1191, 1192,
  1193, 1194, 1195, 1196,
  1198, 1199, 1200, 1201,
  1202, 1203, 1204, 1205,
  1206, 1207, 1208, 1209,
  1210, 1211, 1212, 1213,
  1214, 1215, 1216, 1217,
  1218, 1219, 1220, 1221,
  1222, 1223, 1224, 1225
]
const marathonDB = sqlite3.getMarathon()
enum liveType {
  NORMAL,
  SPECIAL,
  MARATHON
}

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private liveStatusList: any[]
  private liveGoalList: any[]
  private marathonEvent: eventStatus
  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let [liveGoalResult, liveStatusList] = await Promise.all([
      this.connection.query("SELECT live_goal_reward_id, live_difficulty_id FROM user_live_goal_rewards WHERE user_id= :user;", {
        user: this.user_id
      }),
      this.connection.query("SELECT live_difficulty_id, status, hi_score, hi_combo, clear_cnt FROM user_live_status WHERE user_id= :user;", {
        user: this.user_id
      })
    ])
    let liveGoalList = <any>{}
    for (let i = 0; i < liveGoalResult.length; i++) {
      if (!liveGoalList[liveGoalResult[i].live_difficulty_id]) {
        liveGoalList[liveGoalResult[i].live_difficulty_id] = []
      }
      liveGoalList[liveGoalResult[i].live_difficulty_id].push(liveGoalResult[i].live_goal_reward_id)
    }
    this.liveStatusList = liveStatusList
    this.liveGoalList = liveGoalList
    this.marathonEvent = await new Events(this.connection).getEventStatus(Events.getEventTypes().TOKEN)

    return {
      status: 200,
      result: {
        normal_live_status_list: await this.getLiveStatusList(Live.getNormalLiveList(), liveType.NORMAL),
        special_live_status_list: await this.getLiveStatusList(Live.getSpecialLiveList(), liveType.SPECIAL),
        marathon_live_status_list: await this.getLiveStatusList([], liveType.MARATHON),
        training_live_status_list: [], // possible will be not implemented on this server
        free_live_status_list: [], // quest event lives?
        can_resume_live: true
      }
    }
  }

  private async getLiveStatusList(liveList: number[], type: liveType) {
    if (type === liveType.MARATHON && this.marathonEvent.active) {
      liveList = (await marathonDB.all("SELECT live_difficulty_id FROM event_marathon_live_schedule_m WHERE event_id = :id", {
        id: this.marathonEvent.id
      })).map(live => live.live_difficulty_id)
    }

    let unlockedList = <any>{}
    for (const live of this.liveStatusList) {
      if (live.status > 0 && liveList.includes(live.live_difficulty_id)) {
        unlockedList[live.live_difficulty_id] = {
          status: live.status,
          hi_score: live.hi_score,
          hi_combo: live.hi_combo,
          clear_cnt: live.clear_cnt
        }
      }
    }

    if (type === liveType.NORMAL) {
      for (const live of normalLiveUnlock) {
        if (!unlockedList[live]) unlockedList[live] = {
          status: 1,
          hi_score: 0,
          hi_combo: 0,
          clear_cnt: 0
        }
      }
    } else if (type === liveType.MARATHON) {
      for (const live of liveList) {
        if (!unlockedList[live]) unlockedList[live] = {
          status: 1,
          hi_score: 0,
          hi_combo: 0,
          clear_cnt: 0
        }
      }
    }

    if (Config.modules.live.unlockAll) {
      for (const live of liveList) {
        if (!unlockedList[live]) unlockedList[live] = {
          status: 1,
          hi_score: 0,
          hi_combo: 0,
          clear_cnt: 0
        }
      }
    }

    let result = <any[]>[]
    for (let ldid in unlockedList) {
      if (!unlockedList.hasOwnProperty(ldid)) continue
      let status = unlockedList[ldid]

      result.push({
        live_difficulty_id: parseInt(ldid),
        status: parseInt(status.status),
        hi_score: parseInt(status.hi_score),
        hi_combo_count: parseInt(status.hi_combo),
        clear_cnt: parseInt(status.clear_cnt),
        achieved_goal_id_list: this.liveGoalList[parseInt(ldid)] || []
      })
    }

    return result
  }
}