import { Live } from "../../../common/live"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

const liveDB = sqlite3.getLiveDB()

const lives: { [count: number]: { name: string, query: string } } = {
  5: {
    name: "5 Master songs \n(Muse and Aqours)",
    query: `SELECT (live_setting_id + 1000) as live_difficulty_id, live_setting_id, stage_level, asset_background_id, swing_flag FROM live_setting_m WHERE difficulty = 6 AND live_setting_id < 20000 AND live_setting_id IN (${Live.getAvailableLiveList().join(",")})`
  },
  4: {
    name: "4 Master songs \n(Muse and Aqours)",
    query: `SELECT (live_setting_id + 1000) as live_difficulty_id, live_setting_id, stage_level, asset_background_id, swing_flag FROM live_setting_m WHERE difficulty = 6 AND live_setting_id < 20000 AND live_setting_id IN (${Live.getAvailableLiveList().join(",")})`
  },
  3: {
    name: "3 Master songs \n(Muse and Aqours)",
    query: `SELECT (live_setting_id + 1000) as live_difficulty_id, live_setting_id, stage_level, asset_background_id, swing_flag FROM live_setting_m WHERE difficulty = 6 AND live_setting_id < 20000 AND live_setting_id IN (${Live.getAvailableLiveList().join(",")})`
  },
  2: {
    name: "2 Master songs \n(Muse and Aqours)",
    query: `SELECT (live_setting_id + 1000) as live_difficulty_id, live_setting_id, stage_level, asset_background_id, swing_flag FROM live_setting_m WHERE difficulty = 6 AND live_setting_id < 20000 AND live_setting_id IN (${Live.getAvailableLiveList().join(",")})`
  },
}

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    // let status = User.getClassSystemStatus(this.user_id)
    let deck = await this.live.getUserDeck(this.user_id, (await this.connection.first("SELECT main_deck FROM users WHERE user_id = :user", {
      user: this.user_id
    })).main_deck, true, undefined, true)

    let list = <any[]>[]

    let missionTemplate = {
      type: 2, // medfes type
      class_mission_id: 0,
      mission_string: "Template",
      must_flag: true,
      complete_flag: false,
      play_cnt: 0,
      max_play_cnt: 5,
      reset_term: 1,
      cnt_reset_date: Utils.parseDate(Date.now()),
      reset_start_date: 1,
      reset_start_day: 1,
      reset_start_time: "00:00:01",
      keep_hp_flag: false,
      live_cnt: 5,
      preset_deck_name: "Template",
      preset_deck_info: deck.deck,
      live_list: <any>[],
      detail: [
        {
          condition_id: 1,
          condition_string: "Выжить"
        }
      ]
    }

    for (let count of Object.keys(lives)) {
      let template = Utils.createObjCopy(missionTemplate)
      let liveList = await liveDB.all(lives[parseInt(count)].query)
      template.live_cnt = template.class_mission_id = parseInt(count)
      template.mission_string = lives[parseInt(count)].name

      for (let i = 1; i < parseInt(count); i++) {
        template.live_list.push({
          live_cnt: i,
          live_list: liveList
        })
      }

      list.push(template)
    }

    return {
      status: 200,
      result: {
        message: "TODO"
      }
    }
  }
}
