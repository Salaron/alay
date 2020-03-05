import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Utils } from "../../../common/utils"

const defaultUnlock = [1]
const itemDB = sqlite3.getItemDB()
const bgList = [1]

export async function init(): Promise<void> {
  const backgrounds = await itemDB.all(`SELECT background_id as id FROM background_m WHERE background_id NOT IN (${bgList.join(",")})`)
  for (const background of backgrounds) bgList.push(background.id)
}

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const response = {
      background_info: <any>[]
    }

    const currBG = await this.connection.first("SELECT setting_background_id as id FROM users WHERE user_id=:user", { user: this.user_id })
    if (Config.modules.background.unlockAll) {
      let bgExists = false
      for (const bg of bgList) {
        if (currBG.id == bg) bgExists = true
        response.background_info.push({
          background_id: bg,
          is_set: currBG.id == bg,
          insert_date: "2018-01-01 00:00:01"
        })
      }
      if (bgExists === false) response.background_info[0].is_set = true
      return {
        status: 200,
        result: response
      }
    }

    const unlockedBackgroundList = <any>{}
    const unlockedBackgroundData = await this.connection.query("SELECT background_id, insert_date FROM user_background_unlock WHERE user_id=:user;", { user: this.user_id })
    let unlockedCurrentBackground = defaultUnlock.includes(currBG.id)
    for (const bgData of unlockedBackgroundData) {
      unlockedBackgroundList[bgData.background_id] = Utils.parseDate(bgData.insert_date)
      if (bgData.background_id === currBG.id) {
        unlockedCurrentBackground = true
      }
    }
    if (!unlockedCurrentBackground) {
      currBG.id = 1
    }

    for (const bg of bgList) {
      if (unlockedBackgroundList[bg]) {
        response.background_info.push({
          background_id: bg,
          is_set: currBG.id == bg,
          insert_date: unlockedBackgroundList[bg]
        })
        continue
      }

      if (defaultUnlock.includes(bg)) {
        response.background_info.push({
          background_id: bg,
          is_set: currBG.id == bg,
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
