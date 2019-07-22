import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

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

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return {}
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    const config = Config.modules.live

    let response: any = {
      normal_live_status_list: [],
      special_live_status_list: [],
      marathon_live_status_list: [], // TODO 
      training_live_status_list: [], // possible will be not implemented on this server
      free_live_status_list: [], // quest event lives?
      can_resume_live: true
    }

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
    function prepareLiveStatusList(liveList: any, responseString: string) {
      let unlockedList = <any>{}
      for (let i = 0; i < liveStatusList.length; i++) {
        if ((liveStatusList[i].status > 0 && config.unlockAll) && liveList.includes(liveStatusList[i].live_difficulty_id)) {
          unlockedList[liveStatusList[i].live_difficulty_id] = {
            status: liveStatusList[i].status,
            hi_score: liveStatusList[i].hi_score,
            hi_combo: liveStatusList[i].hi_combo,
            clear_cnt: liveStatusList[i].clear_cnt
          }
        }
      }

      if (responseString === "normal_live_status_list") {
        for (let i = 0; i < normalLiveUnlock.length; i++) {
          if (!unlockedList[normalLiveUnlock[i]]) {
            unlockedList[normalLiveUnlock[i]] = {
              status: 1,
              hi_score: 0,
              hi_combo: 0,
              clear_cnt: 0
            }
          }
        }
      }

      for (let i = 0; i < liveList.length; i++) {
        if (config.unlockAll && !unlockedList[liveList[i]]) {
          unlockedList[liveList[i]] = {
            status: 1,
            hi_score: 0,
            hi_combo: 0,
            clear_cnt: 0
          }
        }
      }

      for (let ldid in unlockedList) {
        if (!unlockedList.hasOwnProperty(ldid)) continue
        let status = unlockedList[ldid]

        response[responseString].push({
          live_difficulty_id: parseInt(ldid),
          status: parseInt(status.status),
          hi_score: parseInt(status.hi_score),
          hi_combo_count: parseInt(status.hi_combo),
          clear_cnt: parseInt(status.clear_cnt),
          achieved_goal_id_list: liveGoalList[ldid] || []
        })
      }
    }

    prepareLiveStatusList(Live.getNormalLiveList(), "normal_live_status_list")
    prepareLiveStatusList(Live.getSpecialLiveList(), "special_live_status_list")
    return {
      status: 200,
      result: response
    }
  }
}