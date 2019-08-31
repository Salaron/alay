import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Utils } from "../../../common/utils"

const defaultUnlock = [1]
const itemDB = sqlite3.getItem()
let bgList = [1]

export async function init(): Promise<void> {
  let backgrounds = await itemDB.all(`SELECT background_id as id FROM background_m WHERE background_id NOT IN (${bgList.join(",")})`)
  for (const background of backgrounds) bgList.push(background.id)
}

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let response = {
      background_info: <any>[]
    }

    let currBG = await this.connection.first("SELECT setting_background_id as id FROM users WHERE user_id=:user", { user: this.user_id })
    if (Config.modules.background.unlockAll) {
      let bgExists = false
      for (let i = 0; i < bgList.length; i++) {
        if (currBG.id == bgList[i]) bgExists = true
        response.background_info.push({
          background_id: bgList[i],
          is_set: currBG.id == bgList[i],
          insert_date: "2018-01-01 00:00:01"
        })
      }
      if (bgExists === false) response.background_info[0].is_set = true 
      return {
        status: 200,
        result: response
      }
    }

    let unlockedBackgroundList = <any>{}
    let unlockedBackgroundData = await this.connection.query("SELECT background_id, insert_date FROM user_background_unlock WHERE user_id=:user;", { user: this.user_id })
    let unlockedCurrentBackground = defaultUnlock.includes(currBG.id)
    for (let i = 0; i < unlockedBackgroundData.length; i++) {
      unlockedBackgroundList[unlockedBackgroundData[i].background_id] = Utils.parseDate(unlockedBackgroundData[i].insert_date)
      if (unlockedBackgroundData[i].background_id === currBG.id) {
        unlockedCurrentBackground = true
      }
    }
    if (!unlockedCurrentBackground) {
      currBG.id = 1
    }

    for (let i = 0; i < bgList.length; i++) {
      if (unlockedBackgroundList[bgList[i]]) {
        response.background_info.push({
          background_id: bgList[i],
          is_set: currBG.id == bgList[i],
          insert_date: unlockedBackgroundList[bgList[i]]
        })
        continue
      }

      if (defaultUnlock.includes(bgList[i])) {
        response.background_info.push({
          background_id: bgList[i],
          is_set: currBG.id == bgList[i],
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