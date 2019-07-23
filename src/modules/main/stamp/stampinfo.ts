import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

let otherDB = sqlite3.getOther()
let ids: number[] = []

export async function init(): Promise<void> {
  let all = await otherDB.all("SELECT stamp_id FROM stamp_m ORDER BY unit_type_id ASC")
  ids = all.map((s: any) => { return s.stamp_id })
}

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
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
    let response = {
      owning_stamp_ids: ids,
      stamp_setting: [
        {
          stamp_type: 1,
          setting_list: <any>[]
        },
        {
          stamp_type: 2,
          setting_list: <any>[]
        }
      ]
    }
    let data = await this.connection.query(`
    SELECT 
      deck.user_id, deck.stamp_type, deck.stamp_setting_id, deck.main_flag, slot.position, slot.stamp_id 
    FROM user_stamp_deck as deck 
    JOIN user_stamp_deck_slot as slot ON ( 
      deck.user_id = slot.user_id AND deck.stamp_type = slot.stamp_type AND deck.stamp_setting_id = slot.stamp_setting_id \
    ) 
    WHERE deck.user_id = :user AND deck.stamp_type IN (1,2) AND deck.stamp_setting_id IN (1,2,3,4,5)`, {
      user: this.user_id
    })

    if (data.length === 0) { // Prepare decks if not exist
      let id_arr = [19, 20, 21, 22, 23, 24, 25, 26, 27, 119, 120, 121, 122, 123, 124, 125, 126, 127, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009]

      let insertDecks = []
      for (let i = 1; i <= 5; i++) {
        if (i === 1) {
          insertDecks.push("(" + this.user_id + ", 1, " + i + ", 1)")
        } else {
          insertDecks.push("(" + this.user_id + ", 1, " + i + ", 0)")
        }
      }

      for (let i = 1; i <= 5; i++) {
        if (i === 1) {
          insertDecks.push("(" + this.user_id + ", 2, " + i + ", 1)")
        } else {
          insertDecks.push("(" + this.user_id + ", 2, " + i + ", 0)")
        }
      }
      await this.connection.query(`INSERT INTO user_stamp_deck (user_id, stamp_type, stamp_setting_id, main_flag) VALUES ${insertDecks.join(",")}`)
      let insertStamp = []

      for (let type = 1; type <= 2; type++) {
        for (let deck = 1; deck <= 5; deck++) {
          let position = type === 1 ? 18 : 9
          let t = id_arr.slice()
          let stamp = type === 1 ? t.slice(0, 18) : t.slice(18, 27)
          for (let k = 1; k <= position; k++) {
            insertStamp.push("(" + this.user_id + ", " + type + ", " + deck + ", " + k + ", " + stamp[k - 1] + ")")
          }
        }
      }
      await this.connection.query(`INSERT INTO user_stamp_deck_slot VALUES ${insertStamp.join(",")}`)
      data = await this.connection.query(`
      SELECT 
        deck.user_id, deck.stamp_type, deck.stamp_setting_id, deck.main_flag, slot.position, slot.stamp_id 
      FROM user_stamp_deck as deck 
      JOIN user_stamp_deck_slot as slot ON ( 
        deck.user_id = slot.user_id AND deck.stamp_type = slot.stamp_type AND deck.stamp_setting_id = slot.stamp_setting_id \
      ) 
      WHERE deck.user_id = :user AND deck.stamp_type IN (1,2) AND deck.stamp_setting_id IN (1,2,3,4,5)`, {
        user: this.user_id
      })
    }

    let list = <any>{}
    for (let i = 0; i < data.length; i++) {
      let d = data[i]
      if (!list[d.stamp_type + "," + d.stamp_setting_id]) {
        list[d.stamp_type + "," + d.stamp_setting_id] = {
          stamp_setting_id: d.stamp_setting_id,
          main_flag: d.main_flag,
          stamp_list: []
        }
      }

      list[d.stamp_type + "," + d.stamp_setting_id].stamp_list.push({
        position: d.position,
        stamp_id: d.stamp_id
      })
    }

    await Object.keys(list).forEachAsync(async (stamp: any) => {
      if (stamp[0] === "1") {
        response.stamp_setting[0].setting_list.push(list[stamp])
      } else if (stamp[0] === "2") {
        response.stamp_setting[1].setting_list.push(list[stamp])
      }
    })

    return {
      status: 200,
      result: response
    }
  }
}