import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"
import { Item } from "../../../common/item"

const achievementDB = sqlite3.getAchievement()

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const list: any[] = []
    const loginAc = await achievementDB.all("SELECT * FROM achievement_m WHERE achievement_type = 52 ORDER BY achievement_id ASC")

    const loginCnt = (await this.connection.first(`SELECT COUNT(*) as cnt FROM login_received_list WHERE user_id = :user`, { user: this.user_id })).cnt
    for (const ac of loginAc) {
      if (loginCnt < ac.params1) break
      const reward: any = Utils.createObjCopy(Config.lbonus.total_login_bonus[ac.params1])
      reward.add_type = Item.nameToType(reward.name).itemType
      reward.item_id = Item.nameToType(reward.name, reward.item_id).itemId
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
    }
    return {
      status: 200,
      result: [
        { achievement_category_id: 1, count: list.length, achievement_list: list }
      ]
    }
  }
}
