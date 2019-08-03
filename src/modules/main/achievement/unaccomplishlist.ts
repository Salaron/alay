import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

const achievementDB = sqlite3.getAchievement()

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

  public async execute() {
    let list: any[] = []
    let loginAc = await achievementDB.all("SELECT * FROM achievement_m WHERE achievement_type = 52 ORDER BY achievement_id ASC")

    let loginCnt = (await this.connection.first(`SELECT COUNT(*) as cnt FROM login_received_list WHERE user_id = :user`, { user: this.user_id })).cnt
    for (const ac of loginAc) {
      if (loginCnt >= ac.params1) continue
      if (loginCnt - ac.params1 < 0 && list.length === 0) {
        let reward: any = Config.lbonus.total_login_bonus[ac.params1]
        reward.add_type = Item.nameToType(reward.name).itemType
        reward.item_id = Item.nameToType(reward.name).itemId
        list.push({
          achievement_id: ac.achievement_id,
          count: loginCnt,
          is_accomplished: true,
          insert_date: Utils.toSpecificTimezone(9),
          remaining_time: "",
          is_new: false,
          for_display: true,
          reward_list: [
            reward
          ]
        })
      } else break
    }
    return {
      status: 200,
      result: [
        { achievement_category_id: 1, count: list.length, achievement_list: list }
      ]
    }
  }
}