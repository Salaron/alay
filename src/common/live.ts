import { Connection } from "../core/database"
import { Log } from "../core/log"

const log = new Log("Common: Live")

const liveDB = sqlite3.getLive()
const liveNotesDB = sqlite3.getNotes()
const festDB = sqlite3.getFestival()

let availableLiveList: number[] = []
let normalLiveList: number[] = []
let specialLiveList: number[] = []
export async function init() {
  let liveSettings = await liveNotesDB.all("SELECT DISTINCT live_setting_id FROM live_note")
  for (let i = 0; i < liveSettings.length; i++) {
    availableLiveList.push(liveSettings[i].live_setting_id)
  }
  log.info(`Found note data for ${availableLiveList.length} lives`)

  let normal = await liveDB.all("SELECT live_difficulty_id, live_setting_id FROM normal_live_m")
  for (let i = 0; i < normal.length; i++) {
    if (availableLiveList.includes(normal[i].live_setting_id)) {
      normalLiveList.push(normal[i].live_difficulty_id)
    } else {
      log.verbose(`Missing Note Data for Normal Live #${normal[i].live_difficulty_id} (Setting #${normal[i].live_setting_id})`)
    }
  }
  log.info(`Found data for ${normalLiveList.length} normal lives`)

  let special = await liveDB.all("SELECT live_difficulty_id, live_setting_id FROM special_live_m")
  for (let i = 0; i < special.length; i++) {
    if (availableLiveList.includes(special[i].live_setting_id)) {
      specialLiveList.push(special[i].live_difficulty_id)
    } else {
      log.verbose(`Missing Note Data for Special Live #${special[i].live_difficulty_id} (Setting #${special[i].live_setting_id})`)
    }
  }
  log.info(`Found data for ${specialLiveList.length} special lives`)
}

export class Live {
  connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public static getAvailableLiveList() {
    return availableLiveList
  }
  public static getNormalLiveList() {
    return normalLiveList
  }
  public static getSpecialLiveList() {
    return specialLiveList
  }
}
(global as any).Live = Live