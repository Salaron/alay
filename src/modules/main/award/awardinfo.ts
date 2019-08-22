import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

const defaultUnlock = [1, 23]
const itemDB = sqlite3.getItem()
let awardList = [1, 23]

export async function init(): Promise<void> {
  let awards = await itemDB.all(`SELECT award_id as id FROM award_m WHERE award_id NOT IN (${awardList.join(",")})`)
  for (const award of awards) awardList.push(award.id)
}

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
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
    return {}
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let response = {
      award_info: <any>[]
    }

    let currAward = await this.connection.first("SELECT setting_award_id as id FROM users WHERE user_id=:user", {
      user: this.user_id
    })
    if (Config.modules.award.unlockAll) {
      let awardExists = false
      for (let i = 0; i < awardList.length; i++) {
        if (currAward.id == awardList[i]) awardExists = true
        response.award_info.push({
          award_id: awardList[i],
          is_set: currAward.id == awardList[i],
          insert_date: "2018-01-01 00:00:01"
        })
      }
      if (awardExists === false) response.award_info[0].is_set = true 
      return {
        status: 200,
        result: response
      }
    }

    let unlockedAwardList = <any>{}
    let unlockedAwardData = await this.connection.query("SELECT award_id, insert_date FROM user_award_unlock WHERE user_id=:user;", {
      user: this.user_id
    })
    let unlockedCurrentAward = defaultUnlock.includes(currAward.id)
    for (let i = 0; i < unlockedAwardData.length; i++) {
      unlockedAwardList[unlockedAwardData[i].award_id] = Utils.parseDate(unlockedAwardData[i].insert_date)
      if (unlockedAwardData[i].award_id === currAward.id) {
        unlockedCurrentAward = true
      }
    }
    if (!unlockedCurrentAward) {
      currAward.id = 1
    }

    for (let i = 0; i < awardList.length; i++) {
      if (unlockedAwardList[awardList[i]]) {
        response.award_info.push({
          award_id: awardList[i],
          is_set: currAward.id == awardList[i],
          insert_date: unlockedAwardList[awardList[i]]
        })
        continue
      }

      if (defaultUnlock.includes(awardList[i])) {
        response.award_info.push({
          award_id: awardList[i],
          is_set: currAward.id == awardList[i],
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