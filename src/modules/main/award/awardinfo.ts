import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"

const defaultUnlock = [1, 23]
const itemDB = sqlite3.getItem()
const awardList = [1, 23]

export async function init(): Promise<void> {
  const awards = await itemDB.all(`SELECT award_id as id FROM award_m WHERE award_id NOT IN (${awardList.join(",")})`)
  for (const award of awards) awardList.push(award.id)
}

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const response = {
      award_info: <any>[]
    }

    const currAward = await this.connection.first("SELECT setting_award_id as id FROM users WHERE user_id=:user", {
      user: this.user_id
    })
    if (Config.modules.award.unlockAll) {
      let awardExists = false
      for (const award of awardList) {
        if (currAward.id == award) awardExists = true
        response.award_info.push({
          award_id: award,
          is_set: currAward.id == award,
          insert_date: "2018-01-01 00:00:01"
        })
      }
      if (awardExists === false) response.award_info[0].is_set = true
      return {
        status: 200,
        result: response
      }
    }

    const unlockedAwardList = <any>{}
    const unlockedAwardData = await this.connection.query("SELECT award_id, insert_date FROM user_award_unlock WHERE user_id=:user;", {
      user: this.user_id
    })
    let unlockedCurrentAward = defaultUnlock.includes(currAward.id)
    for (const award of unlockedAwardData) {
      unlockedAwardList[award.award_id] = Utils.parseDate(award.insert_date)
      if (award.award_id === currAward.id) {
        unlockedCurrentAward = true
      }
    }
    if (!unlockedCurrentAward) {
      currAward.id = 1
    }

    for (const award of awardList) {
      if (unlockedAwardList[award]) {
        response.award_info.push({
          award_id: award,
          is_set: currAward.id == award,
          insert_date: unlockedAwardList[award]
        })
        continue
      }

      if (defaultUnlock.includes(award)) {
        response.award_info.push({
          award_id: award,
          is_set: currAward.id == award,
          insert_date: "2018-01-01 00:00:01"
        })
      }
    }

    return {
      status: 200,
      result: response
    }
  }
}
