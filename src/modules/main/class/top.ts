import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Live } from "../../../common/live"
import { Utils } from "../../../common/utils"
import { User } from "../../../common/user"

const liveDB = sqlite3.getLive()

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

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const user = new User(this.connection)
    const live = new Live(this.connection)

    let status = User.getClassSystemStatus(this.user_id)
    let deck = await live.getUserDeck(this.user_id, (await this.connection.first("SELECT main_deck FROM users WHERE user_id = :user", {
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
        class_rank_id: 6,
        before_class_rank_id: 6,
        mission_cnt: 4,
        mission_list: [
          {
            type: 3,
            class_mission_id: 26,
            mission_string: "μ'sのMASTERの<br>指定楽曲を<br>コンボランクC以上で<br>1回クリア",
            must_flag: false,
            complete_flag: true,
            play_cnt: 0,
            max_play_cnt: 7,
            reset_term: 2,
            cnt_reset_date: "2019-09-22 23:59:59",
            reset_start_date: 1,
            reset_start_day: 2,
            reset_start_time: "00:00:00",
            keep_hp_flag: false,
            live_cnt: 1,
            preset_deck_name: "μ's（判定強化）",
            preset_deck_info: [
              {
                position: 1,
                unit_id: 1495,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 2,
                unit_id: 572,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 3,
                unit_id: 461,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 4,
                unit_id: 112,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 5,
                unit_id: 527,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 6,
                unit_id: 440,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 7,
                unit_id: 899,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 8,
                unit_id: 981,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 9,
                unit_id: 1302,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              }
            ],
            live_list: [
              {
                live_cnt: 1,
                live_list: [
                  {
                    live_difficulty_id: 80008,
                    live_setting_id: 588,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80018,
                    live_setting_id: 650,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80020,
                    live_setting_id: 660,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80036,
                    live_setting_id: 717,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80039,
                    live_setting_id: 720,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80047,
                    live_setting_id: 749,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80053,
                    live_setting_id: 795,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80061,
                    live_setting_id: 817,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80067,
                    live_setting_id: 859,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80071,
                    live_setting_id: 873,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80079,
                    live_setting_id: 905,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80087,
                    live_setting_id: 933,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80089,
                    live_setting_id: 935,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80095,
                    live_setting_id: 953,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80001,
                    live_setting_id: 529,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80002,
                    live_setting_id: 558,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80003,
                    live_setting_id: 563,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80004,
                    live_setting_id: 568,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80007,
                    live_setting_id: 583,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80009,
                    live_setting_id: 589,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80010,
                    live_setting_id: 608,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80011,
                    live_setting_id: 609,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80012,
                    live_setting_id: 614,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80013,
                    live_setting_id: 619,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80014,
                    live_setting_id: 628,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80016,
                    live_setting_id: 634,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80017,
                    live_setting_id: 641,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80019,
                    live_setting_id: 655,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80021,
                    live_setting_id: 661,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80022,
                    live_setting_id: 670,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80023,
                    live_setting_id: 671,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80024,
                    live_setting_id: 672,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80025,
                    live_setting_id: 673,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80026,
                    live_setting_id: 681,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80027,
                    live_setting_id: 686,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80028,
                    live_setting_id: 687,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80030,
                    live_setting_id: 693,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80034,
                    live_setting_id: 715,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80037,
                    live_setting_id: 718,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80041,
                    live_setting_id: 722,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80043,
                    live_setting_id: 737,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80045,
                    live_setting_id: 745,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80049,
                    live_setting_id: 773,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80051,
                    live_setting_id: 789,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80055,
                    live_setting_id: 807,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80057,
                    live_setting_id: 809,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80059,
                    live_setting_id: 811,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80060,
                    live_setting_id: 812,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80063,
                    live_setting_id: 823,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80064,
                    live_setting_id: 832,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80065,
                    live_setting_id: 833,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80069,
                    live_setting_id: 863,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80070,
                    live_setting_id: 868,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80072,
                    live_setting_id: 874,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80073,
                    live_setting_id: 883,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80075,
                    live_setting_id: 889,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80077,
                    live_setting_id: 895,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80080,
                    live_setting_id: 910,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80081,
                    live_setting_id: 911,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80084,
                    live_setting_id: 918,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80085,
                    live_setting_id: 919,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80086,
                    live_setting_id: 928,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80090,
                    live_setting_id: 944,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80091,
                    live_setting_id: 945,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80092,
                    live_setting_id: 946,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80093,
                    live_setting_id: 947,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80097,
                    live_setting_id: 959,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80101,
                    live_setting_id: 975,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80102,
                    live_setting_id: 982,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80103,
                    live_setting_id: 983,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80104,
                    live_setting_id: 988,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80105,
                    live_setting_id: 989,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80005,
                    live_setting_id: 577,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80006,
                    live_setting_id: 582,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80015,
                    live_setting_id: 629,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80029,
                    live_setting_id: 688,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80031,
                    live_setting_id: 698,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80032,
                    live_setting_id: 699,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80033,
                    live_setting_id: 700,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80035,
                    live_setting_id: 716,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80038,
                    live_setting_id: 719,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80040,
                    live_setting_id: 721,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80042,
                    live_setting_id: 731,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80044,
                    live_setting_id: 744,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80046,
                    live_setting_id: 748,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80048,
                    live_setting_id: 768,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80050,
                    live_setting_id: 788,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80052,
                    live_setting_id: 794,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80054,
                    live_setting_id: 806,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80056,
                    live_setting_id: 808,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80058,
                    live_setting_id: 810,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80062,
                    live_setting_id: 822,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80066,
                    live_setting_id: 854,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80068,
                    live_setting_id: 860,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80074,
                    live_setting_id: 888,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80076,
                    live_setting_id: 894,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80078,
                    live_setting_id: 896,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80082,
                    live_setting_id: 916,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80083,
                    live_setting_id: 917,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80088,
                    live_setting_id: 934,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80094,
                    live_setting_id: 948,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80096,
                    live_setting_id: 958,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80098,
                    live_setting_id: 960,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80099,
                    live_setting_id: 965,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80100,
                    live_setting_id: 970,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80106,
                    live_setting_id: 990,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  }
                ]
              }
            ],
            detail: [
              {
                condition_id: 1,
                condition_string: "MASTERの楽曲をクリア"
              },
              {
                condition_id: 2,
                condition_string: "コンボランクC以上でクリア"
              }
            ],
            live_complete_info: []
          },
          {
            type: 3,
            class_mission_id: 27,
            mission_string: "AqoursのMASTERの<br>指定楽曲を<br>コンボランクC以上で<br>1回クリア",
            must_flag: false,
            complete_flag: true,
            play_cnt: 0,
            max_play_cnt: 7,
            reset_term: 2,
            cnt_reset_date: "2019-09-22 23:59:59",
            reset_start_date: 1,
            reset_start_day: 2,
            reset_start_time: "00:00:00",
            keep_hp_flag: false,
            live_cnt: 1,
            preset_deck_name: "Aqours（判定強化）",
            preset_deck_info: [
              {
                position: 1,
                unit_id: 1594,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 2,
                unit_id: 1112,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 3,
                unit_id: 1189,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 4,
                unit_id: 931,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 5,
                unit_id: 1165,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 6,
                unit_id: 1523,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 7,
                unit_id: 1397,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 8,
                unit_id: 1704,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 9,
                unit_id: 1078,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              }
            ],
            live_list: [
              {
                live_cnt: 1,
                live_list: [
                  {
                    live_difficulty_id: 80112,
                    live_setting_id: 997,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80114,
                    live_setting_id: 1003,
                    stage_level: 11,
                    asset_background_id: 32,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80107,
                    live_setting_id: 732,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80108,
                    live_setting_id: 976,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80109,
                    live_setting_id: 977,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80110,
                    live_setting_id: 995,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80111,
                    live_setting_id: 996,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80113,
                    live_setting_id: 1002,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80115,
                    live_setting_id: 1004,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80116,
                    live_setting_id: 1009,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80117,
                    live_setting_id: 1014,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 1
                  },
                  {
                    live_difficulty_id: 80118,
                    live_setting_id: 1019,
                    stage_level: 12,
                    asset_background_id: 125,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              }
            ],
            detail: [
              {
                condition_id: 3,
                condition_string: "MASTERの楽曲をクリア"
              },
              {
                condition_id: 4,
                condition_string: "コンボランクC以上でクリア"
              }
            ],
            live_complete_info: []
          },
          {
            type: 3,
            class_mission_id: 28,
            mission_string: "μ'sのEXPERTの<br>指定楽曲をフルコンボで<br>1回クリア",
            must_flag: false,
            complete_flag: false,
            play_cnt: 0,
            max_play_cnt: 7,
            reset_term: 2,
            cnt_reset_date: "2019-09-22 23:59:59",
            reset_start_date: 1,
            reset_start_day: 2,
            reset_start_time: "00:00:00",
            keep_hp_flag: false,
            live_cnt: 1,
            preset_deck_name: "μ's（判定強化）",
            preset_deck_info: [
              {
                position: 1,
                unit_id: 1495,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 2,
                unit_id: 572,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 3,
                unit_id: 461,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 4,
                unit_id: 112,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 5,
                unit_id: 527,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 6,
                unit_id: 440,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 7,
                unit_id: 899,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 8,
                unit_id: 981,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 9,
                unit_id: 1302,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              }
            ],
            live_list: [
              {
                live_cnt: 1,
                live_list: [
                  {
                    live_difficulty_id: 80119,
                    live_setting_id: 64,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80120,
                    live_setting_id: 68,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80121,
                    live_setting_id: 75,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80122,
                    live_setting_id: 76,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80123,
                    live_setting_id: 77,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80124,
                    live_setting_id: 78,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80125,
                    live_setting_id: 79,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80126,
                    live_setting_id: 83,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80129,
                    live_setting_id: 89,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80130,
                    live_setting_id: 96,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80133,
                    live_setting_id: 102,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80135,
                    live_setting_id: 104,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80136,
                    live_setting_id: 108,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80137,
                    live_setting_id: 109,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80139,
                    live_setting_id: 114,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80140,
                    live_setting_id: 115,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80141,
                    live_setting_id: 116,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80145,
                    live_setting_id: 132,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80146,
                    live_setting_id: 136,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80147,
                    live_setting_id: 140,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80150,
                    live_setting_id: 152,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80152,
                    live_setting_id: 160,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80156,
                    live_setting_id: 198,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80158,
                    live_setting_id: 206,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80161,
                    live_setting_id: 221,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80165,
                    live_setting_id: 246,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80169,
                    live_setting_id: 268,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80170,
                    live_setting_id: 272,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80172,
                    live_setting_id: 283,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80175,
                    live_setting_id: 310,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80176,
                    live_setting_id: 324,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80179,
                    live_setting_id: 344,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80180,
                    live_setting_id: 348,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80181,
                    live_setting_id: 357,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80182,
                    live_setting_id: 364,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80186,
                    live_setting_id: 391,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80188,
                    live_setting_id: 402,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80190,
                    live_setting_id: 418,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80191,
                    live_setting_id: 432,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80196,
                    live_setting_id: 470,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80199,
                    live_setting_id: 530,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80201,
                    live_setting_id: 532,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80205,
                    live_setting_id: 536,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80206,
                    live_setting_id: 537,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80208,
                    live_setting_id: 539,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80211,
                    live_setting_id: 552,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80212,
                    live_setting_id: 553,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80214,
                    live_setting_id: 599,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80215,
                    live_setting_id: 623,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80216,
                    live_setting_id: 654,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80217,
                    live_setting_id: 659,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80219,
                    live_setting_id: 680,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80221,
                    live_setting_id: 706,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80223,
                    live_setting_id: 736,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80224,
                    live_setting_id: 783,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80127,
                    live_setting_id: 84,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80128,
                    live_setting_id: 88,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80131,
                    live_setting_id: 97,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80132,
                    live_setting_id: 98,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80134,
                    live_setting_id: 103,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80138,
                    live_setting_id: 113,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80142,
                    live_setting_id: 120,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80143,
                    live_setting_id: 124,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80144,
                    live_setting_id: 128,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80148,
                    live_setting_id: 144,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80149,
                    live_setting_id: 148,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80151,
                    live_setting_id: 156,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80153,
                    live_setting_id: 164,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80154,
                    live_setting_id: 175,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80155,
                    live_setting_id: 185,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80157,
                    live_setting_id: 202,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80159,
                    live_setting_id: 213,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80160,
                    live_setting_id: 217,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80162,
                    live_setting_id: 229,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80163,
                    live_setting_id: 233,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80164,
                    live_setting_id: 239,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80166,
                    live_setting_id: 250,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80167,
                    live_setting_id: 257,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80168,
                    live_setting_id: 261,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80171,
                    live_setting_id: 276,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80173,
                    live_setting_id: 284,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80174,
                    live_setting_id: 306,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80177,
                    live_setting_id: 331,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80178,
                    live_setting_id: 332,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80183,
                    live_setting_id: 365,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80184,
                    live_setting_id: 374,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80185,
                    live_setting_id: 378,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80187,
                    live_setting_id: 398,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80189,
                    live_setting_id: 411,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80192,
                    live_setting_id: 445,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80193,
                    live_setting_id: 446,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80194,
                    live_setting_id: 456,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80195,
                    live_setting_id: 463,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80197,
                    live_setting_id: 488,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80198,
                    live_setting_id: 512,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80200,
                    live_setting_id: 531,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80202,
                    live_setting_id: 533,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80203,
                    live_setting_id: 534,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80204,
                    live_setting_id: 535,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80207,
                    live_setting_id: 538,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80209,
                    live_setting_id: 492,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80210,
                    live_setting_id: 551,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80213,
                    live_setting_id: 581,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80218,
                    live_setting_id: 665,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80220,
                    live_setting_id: 697,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80222,
                    live_setting_id: 729,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              }
            ],
            detail: [
              {
                condition_id: 5,
                condition_string: "EXPERTの楽曲をクリア"
              },
              {
                condition_id: 6,
                condition_string: "フルコンボでクリア"
              }
            ],
            live_complete_info: []
          },
          {
            type: 3,
            class_mission_id: 29,
            mission_string: "AqoursのEXPERTの<br>指定楽曲をフルコンボで<br>1回クリア",
            must_flag: false,
            complete_flag: false,
            play_cnt: 0,
            max_play_cnt: 7,
            reset_term: 2,
            cnt_reset_date: "2019-09-22 23:59:59",
            reset_start_date: 1,
            reset_start_day: 2,
            reset_start_time: "00:00:00",
            keep_hp_flag: false,
            live_cnt: 1,
            preset_deck_name: "Aqours（判定強化）",
            preset_deck_info: [
              {
                position: 1,
                unit_id: 1594,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 2,
                unit_id: 1112,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 3,
                unit_id: 1189,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 4,
                unit_id: 931,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 5,
                unit_id: 1165,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 6,
                unit_id: 1523,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 7,
                unit_id: 1397,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 8,
                unit_id: 1704,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 9,
                unit_id: 1078,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              }
            ],
            live_list: [
              {
                live_cnt: 1,
                live_list: [
                  {
                    live_difficulty_id: 80225,
                    live_setting_id: 502,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80227,
                    live_setting_id: 520,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80230,
                    live_setting_id: 523,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80231,
                    live_setting_id: 524,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80237,
                    live_setting_id: 562,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80238,
                    live_setting_id: 567,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80239,
                    live_setting_id: 572,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80240,
                    live_setting_id: 576,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80241,
                    live_setting_id: 587,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80243,
                    live_setting_id: 607,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80245,
                    live_setting_id: 618,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80246,
                    live_setting_id: 627,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80247,
                    live_setting_id: 633,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80248,
                    live_setting_id: 645,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80250,
                    live_setting_id: 669,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80254,
                    live_setting_id: 714,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80255,
                    live_setting_id: 742,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80256,
                    live_setting_id: 767,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80258,
                    live_setting_id: 779,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80260,
                    live_setting_id: 793,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80261,
                    live_setting_id: 805,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80262,
                    live_setting_id: 816,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80264,
                    live_setting_id: 827,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80266,
                    live_setting_id: 837,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80269,
                    live_setting_id: 872,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80271,
                    live_setting_id: 882,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80272,
                    live_setting_id: 887,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80273,
                    live_setting_id: 893,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80274,
                    live_setting_id: 900,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80275,
                    live_setting_id: 904,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80276,
                    live_setting_id: 909,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80277,
                    live_setting_id: 915,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80278,
                    live_setting_id: 923,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80279,
                    live_setting_id: 927,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80280,
                    live_setting_id: 932,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80282,
                    live_setting_id: 943,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80283,
                    live_setting_id: 952,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80284,
                    live_setting_id: 957,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80285,
                    live_setting_id: 964,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80286,
                    live_setting_id: 969,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80287,
                    live_setting_id: 974,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80288,
                    live_setting_id: 981,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80290,
                    live_setting_id: 994,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80291,
                    live_setting_id: 1001,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80226,
                    live_setting_id: 519,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80228,
                    live_setting_id: 521,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80229,
                    live_setting_id: 522,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80232,
                    live_setting_id: 525,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80233,
                    live_setting_id: 526,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80234,
                    live_setting_id: 527,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80235,
                    live_setting_id: 528,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80236,
                    live_setting_id: 557,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80242,
                    live_setting_id: 603,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80244,
                    live_setting_id: 613,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80249,
                    live_setting_id: 649,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80251,
                    live_setting_id: 685,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80252,
                    live_setting_id: 692,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80253,
                    live_setting_id: 710,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80257,
                    live_setting_id: 772,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80259,
                    live_setting_id: 787,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80263,
                    live_setting_id: 821,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80265,
                    live_setting_id: 831,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80267,
                    live_setting_id: 858,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80268,
                    live_setting_id: 867,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80270,
                    live_setting_id: 878,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80281,
                    live_setting_id: 939,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80289,
                    live_setting_id: 987,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              }
            ],
            detail: [
              {
                condition_id: 7,
                condition_string: "EXPERTの楽曲をクリア"
              },
              {
                condition_id: 8,
                condition_string: "フルコンボでクリア"
              }
            ],
            live_complete_info: []
          },
          {
            type: 2,
            class_mission_id: 30,
            mission_string: "μ'sのEXPERTの<br>指定楽曲を2回連続通算<br>GREAT以上90%以上でクリア",
            must_flag: false,
            complete_flag: true,
            play_cnt: 0,
            max_play_cnt: 7,
            reset_term: 2,
            cnt_reset_date: "2019-09-22 23:59:59",
            reset_start_date: 1,
            reset_start_day: 2,
            reset_start_time: "00:00:00",
            keep_hp_flag: false,
            live_cnt: 2,
            preset_deck_name: "μ's（判定強化）",
            preset_deck_info: [
              {
                position: 1,
                unit_id: 1495,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 2,
                unit_id: 572,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 3,
                unit_id: 461,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 4,
                unit_id: 112,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 5,
                unit_id: 527,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 6,
                unit_id: 440,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 7,
                unit_id: 899,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 8,
                unit_id: 981,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 9,
                unit_id: 1302,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              }
            ],
            live_list: [
              {
                live_cnt: 1,
                live_list: [
                  {
                    live_difficulty_id: 80119,
                    live_setting_id: 64,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80120,
                    live_setting_id: 68,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80121,
                    live_setting_id: 75,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80122,
                    live_setting_id: 76,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80123,
                    live_setting_id: 77,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80124,
                    live_setting_id: 78,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80125,
                    live_setting_id: 79,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80126,
                    live_setting_id: 83,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80129,
                    live_setting_id: 89,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80130,
                    live_setting_id: 96,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80133,
                    live_setting_id: 102,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80135,
                    live_setting_id: 104,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80136,
                    live_setting_id: 108,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80137,
                    live_setting_id: 109,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80139,
                    live_setting_id: 114,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80140,
                    live_setting_id: 115,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80141,
                    live_setting_id: 116,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80145,
                    live_setting_id: 132,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80146,
                    live_setting_id: 136,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80147,
                    live_setting_id: 140,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80150,
                    live_setting_id: 152,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80152,
                    live_setting_id: 160,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80156,
                    live_setting_id: 198,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80158,
                    live_setting_id: 206,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80161,
                    live_setting_id: 221,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80165,
                    live_setting_id: 246,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80169,
                    live_setting_id: 268,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80170,
                    live_setting_id: 272,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80172,
                    live_setting_id: 283,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80175,
                    live_setting_id: 310,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80176,
                    live_setting_id: 324,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80179,
                    live_setting_id: 344,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80180,
                    live_setting_id: 348,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80181,
                    live_setting_id: 357,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80182,
                    live_setting_id: 364,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80186,
                    live_setting_id: 391,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80188,
                    live_setting_id: 402,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80190,
                    live_setting_id: 418,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80191,
                    live_setting_id: 432,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80196,
                    live_setting_id: 470,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80199,
                    live_setting_id: 530,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80201,
                    live_setting_id: 532,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80205,
                    live_setting_id: 536,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80206,
                    live_setting_id: 537,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80208,
                    live_setting_id: 539,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80211,
                    live_setting_id: 552,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80212,
                    live_setting_id: 553,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80214,
                    live_setting_id: 599,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80215,
                    live_setting_id: 623,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80216,
                    live_setting_id: 654,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80217,
                    live_setting_id: 659,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80219,
                    live_setting_id: 680,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80221,
                    live_setting_id: 706,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80223,
                    live_setting_id: 736,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80224,
                    live_setting_id: 783,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              },
              {
                live_cnt: 2,
                live_list: [
                  {
                    live_difficulty_id: 80127,
                    live_setting_id: 84,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80128,
                    live_setting_id: 88,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80131,
                    live_setting_id: 97,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80132,
                    live_setting_id: 98,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80134,
                    live_setting_id: 103,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80138,
                    live_setting_id: 113,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80142,
                    live_setting_id: 120,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80143,
                    live_setting_id: 124,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80144,
                    live_setting_id: 128,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80148,
                    live_setting_id: 144,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80149,
                    live_setting_id: 148,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80151,
                    live_setting_id: 156,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80153,
                    live_setting_id: 164,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80154,
                    live_setting_id: 175,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80155,
                    live_setting_id: 185,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80157,
                    live_setting_id: 202,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80159,
                    live_setting_id: 213,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80160,
                    live_setting_id: 217,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80162,
                    live_setting_id: 229,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80163,
                    live_setting_id: 233,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80164,
                    live_setting_id: 239,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80166,
                    live_setting_id: 250,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80167,
                    live_setting_id: 257,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80168,
                    live_setting_id: 261,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80171,
                    live_setting_id: 276,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80173,
                    live_setting_id: 284,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80174,
                    live_setting_id: 306,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80177,
                    live_setting_id: 331,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80178,
                    live_setting_id: 332,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80183,
                    live_setting_id: 365,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80184,
                    live_setting_id: 374,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80185,
                    live_setting_id: 378,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80187,
                    live_setting_id: 398,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80189,
                    live_setting_id: 411,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80192,
                    live_setting_id: 445,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80193,
                    live_setting_id: 446,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80194,
                    live_setting_id: 456,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80195,
                    live_setting_id: 463,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80197,
                    live_setting_id: 488,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80198,
                    live_setting_id: 512,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80200,
                    live_setting_id: 531,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80202,
                    live_setting_id: 533,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80203,
                    live_setting_id: 534,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80204,
                    live_setting_id: 535,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80207,
                    live_setting_id: 538,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80209,
                    live_setting_id: 492,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80210,
                    live_setting_id: 551,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80213,
                    live_setting_id: 581,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80218,
                    live_setting_id: 665,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80220,
                    live_setting_id: 697,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80222,
                    live_setting_id: 729,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              }
            ],
            detail: [
              {
                condition_id: 9,
                condition_string: "EXPERTの楽曲をクリア"
              },
              {
                condition_id: 10,
                condition_string: "GREAT以上90%以上でクリア"
              }
            ]
          },
          {
            type: 2,
            class_mission_id: 31,
            mission_string: "AqoursのEXPERTの<br>指定楽曲を2回連続通算<br>GREAT以上90%以上でクリア",
            must_flag: false,
            complete_flag: false,
            play_cnt: 0,
            max_play_cnt: 7,
            reset_term: 2,
            cnt_reset_date: "2019-09-22 23:59:59",
            reset_start_date: 1,
            reset_start_day: 2,
            reset_start_time: "00:00:00",
            keep_hp_flag: false,
            live_cnt: 2,
            preset_deck_name: "Aqours（判定強化）",
            preset_deck_info: [
              {
                position: 1,
                unit_id: 1594,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 2,
                unit_id: 1112,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 3,
                unit_id: 1189,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 4,
                unit_id: 931,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 5,
                unit_id: 1165,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 6,
                unit_id: 1523,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 7,
                unit_id: 1397,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 8,
                unit_id: 1704,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              },
              {
                position: 9,
                unit_id: 1078,
                exp: 0,
                level: 1,
                love: 0,
                unit_skill_exp: 0,
                unit_skill_level: 1,
                max_hp: 3,
                unit_removable_skill_capacity: 2,
                is_rank_max: false,
                is_level_max: false,
                is_love_max: false
              }
            ],
            live_list: [
              {
                live_cnt: 1,
                live_list: [
                  {
                    live_difficulty_id: 80225,
                    live_setting_id: 502,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80227,
                    live_setting_id: 520,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80230,
                    live_setting_id: 523,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80231,
                    live_setting_id: 524,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80237,
                    live_setting_id: 562,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80238,
                    live_setting_id: 567,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80239,
                    live_setting_id: 572,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80240,
                    live_setting_id: 576,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80241,
                    live_setting_id: 587,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80243,
                    live_setting_id: 607,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80245,
                    live_setting_id: 618,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80246,
                    live_setting_id: 627,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80247,
                    live_setting_id: 633,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80248,
                    live_setting_id: 645,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80250,
                    live_setting_id: 669,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80254,
                    live_setting_id: 714,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80255,
                    live_setting_id: 742,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80256,
                    live_setting_id: 767,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80258,
                    live_setting_id: 779,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80260,
                    live_setting_id: 793,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80261,
                    live_setting_id: 805,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80262,
                    live_setting_id: 816,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80264,
                    live_setting_id: 827,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80266,
                    live_setting_id: 837,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80269,
                    live_setting_id: 872,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80271,
                    live_setting_id: 882,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80272,
                    live_setting_id: 887,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80273,
                    live_setting_id: 893,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80274,
                    live_setting_id: 900,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80275,
                    live_setting_id: 904,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80276,
                    live_setting_id: 909,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80277,
                    live_setting_id: 915,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80278,
                    live_setting_id: 923,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80279,
                    live_setting_id: 927,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80280,
                    live_setting_id: 932,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80282,
                    live_setting_id: 943,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80283,
                    live_setting_id: 952,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80284,
                    live_setting_id: 957,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80285,
                    live_setting_id: 964,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80286,
                    live_setting_id: 969,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80287,
                    live_setting_id: 974,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80288,
                    live_setting_id: 981,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80290,
                    live_setting_id: 994,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80291,
                    live_setting_id: 1001,
                    stage_level: 9,
                    asset_background_id: 9,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              },
              {
                live_cnt: 2,
                live_list: [
                  {
                    live_difficulty_id: 80226,
                    live_setting_id: 519,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80228,
                    live_setting_id: 521,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80229,
                    live_setting_id: 522,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80232,
                    live_setting_id: 525,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80233,
                    live_setting_id: 526,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80234,
                    live_setting_id: 527,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80235,
                    live_setting_id: 528,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80236,
                    live_setting_id: 557,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80242,
                    live_setting_id: 603,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80244,
                    live_setting_id: 613,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80249,
                    live_setting_id: 649,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80251,
                    live_setting_id: 685,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80252,
                    live_setting_id: 692,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80253,
                    live_setting_id: 710,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80257,
                    live_setting_id: 772,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80259,
                    live_setting_id: 787,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80263,
                    live_setting_id: 821,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80265,
                    live_setting_id: 831,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80267,
                    live_setting_id: 858,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80268,
                    live_setting_id: 867,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80270,
                    live_setting_id: 878,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80281,
                    live_setting_id: 939,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  },
                  {
                    live_difficulty_id: 80289,
                    live_setting_id: 987,
                    stage_level: 10,
                    asset_background_id: 10,
                    random_flag: false,
                    swing_flag: 0
                  }
                ]
              }
            ],
            detail: [
              {
                condition_id: 11,
                condition_string: "EXPERTの楽曲をクリア"
              },
              {
                condition_id: 12,
                condition_string: "GREAT以上90%以上でクリア"
              }
            ]
          }
        ],
        cleared_rank_info: [
          {
            class_rank_id: 2,
            mission_list: [
              {
                type: 1,
                class_mission_id: 1,
                mission_string: "EASY以上の楽曲を5回クリア",
                complete_flag: false,
                detail: [
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 2,
                mission_string: "EASY以上の楽曲を<br>体力を10以上残して2回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 3,
                mission_string: "EASY以上の楽曲を<br>コンボランクC以上で<br>2回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 4,
                mission_string: "EASY以上の楽曲を<br>GREAT以上80%以上で<br>2回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 5,
                mission_string: "EASY以上の楽曲を<br>BAD以下10回以内で2回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              }
            ]
          },
          {
            class_rank_id: 3,
            mission_list: [
              {
                type: 1,
                class_mission_id: 6,
                mission_string: "NORMAL以上の楽曲を5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 7,
                mission_string: "NORMAL以上の楽曲を<br>体力を10以上残して3回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 8,
                mission_string: "NORMAL以上の楽曲を<br>コンボランクC以上で<br>3回クリア",
                complete_flag: false,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 9,
                mission_string: "NORMAL以上の楽曲を<br>GREAT以上80%以上で<br>3回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 10,
                mission_string: "NORMAL以上の楽曲を<br>BAD以下10回以内で3回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              }
            ]
          },
          {
            class_rank_id: 4,
            mission_list: [
              {
                type: 1,
                class_mission_id: 11,
                mission_string: "HARD以上の楽曲を10回クリア",
                complete_flag: false,
                detail: [
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 12,
                mission_string: "HARD以上の楽曲を<br>体力を10以上残して5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 13,
                mission_string: "HARD以上の楽曲を<br>コンボランクC以上で<br>5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 14,
                mission_string: "HARD以上の楽曲を<br>GREAT以上80%以上で<br>5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 15,
                mission_string: "HARD以上の楽曲を<br>BAD以下10回以内で5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              }
            ]
          },
          {
            class_rank_id: 5,
            mission_list: [
              {
                type: 1,
                class_mission_id: 16,
                mission_string: "EXPERT以上の楽曲を10回クリア",
                complete_flag: false,
                detail: [
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 17,
                mission_string: "EXPERT以上の楽曲を<br>体力を10以上残して5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 18,
                mission_string: "EXPERT以上の楽曲を<br>コンボランクC以上で<br>5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 19,
                mission_string: "EXPERT以上の楽曲を<br>PERFECT90%以上で<br>5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 20,
                mission_string: "EXPERT以上の楽曲を<br>BAD以下5回以内で5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              }
            ]
          },
          {
            class_rank_id: 6,
            mission_list: [
              {
                type: 1,
                class_mission_id: 21,
                mission_string: "EASY以上の楽曲を<br>フルコンボで10回クリア",
                complete_flag: false,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 22,
                mission_string: "NORMAL以上の楽曲を<br>フルコンボで5回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 23,
                mission_string: "HARD以上の楽曲を<br>フルコンボで3回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 24,
                mission_string: "EXPERT以上の楽曲を<br>コンボランクA以上で<br>1回クリア",
                complete_flag: true,
                detail: [
                  [],
                  [],
                  []
                ]
              },
              {
                type: 1,
                class_mission_id: 25,
                mission_string: "MASTERの楽曲を1回クリア",
                complete_flag: true,
                detail: [
                  [],
                  []
                ]
              }
            ]
          }
        ],
        challenge_available: false,
        server_timestamp: 1568822139,
        present_cnt: 366
      }
    }
  }
}
