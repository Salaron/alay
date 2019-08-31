import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../core/requestData"

let otherDB = sqlite3.getOther()
let ids: number[] = []

export async function init(): Promise<void> {
  let all = await otherDB.all("SELECT stamp_id FROM stamp_m ORDER BY unit_type_id ASC")
  ids = all.map((s: any) => { return s.stamp_id })
}

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      main_flag: TYPE.INT,
      stamp_type: TYPE.INT,
      stamp_setting_id: TYPE.INT
    }
  }

  public paramCheck() {
    if (
      this.params.main_flag < 0 || this.params.main_flag > 1 ||
      this.params.stamp_type < 1 || this.params.stamp_type > 2 ||
      this.params.stamp_setting_id < 1 || this.params.stamp_setting_id > 5 ||
      (this.params.stamp_type === 1 && this.params.stamp_list.length != 18) ||
      (this.params.stamp_type === 2 && this.params.stamp_list.length != 9)
    ) throw new Error("Invalid request")
  }

  public async execute() {
    await this.connection.query("DELETE FROM user_stamp_deck_slot WHERE user_id=:user AND stamp_type=:type AND stamp_setting_id=:id", {
      user: this.user_id,
      type: this.params.stamp_type,
      id: this.params.stamp_setting_id
    })

    let stampDeckSlotInsert = []
    for (const stamp of this.params.stamp_list) {
      if (
        !Type.isInt(stamp.stamp_id) || !Type.isInt(stamp.position)
      ) throw new Error(`Invalid stamp_list`)
      stampDeckSlotInsert.push(`(${this.user_id}, ${this.params.stamp_type}, ${this.params.stamp_setting_id}, ${stamp.position}, ${stamp.stamp_id})`)
    }

    await this.connection.execute(`INSERT INTO user_stamp_deck_slot VALUES ${stampDeckSlotInsert.join(",")}`)
    if (this.params.main_flag === 1) {
      await this.connection.query("UPDATE user_stamp_deck SET main_flag = 0 WHERE stamp_type=:type AND user_id=:user", {
        type: this.params.stamp_type,
        user: this.user_id
      })
      await this.connection.query("UPDATE user_stamp_deck SET main_flag = 1 WHERE stamp_setting_id=:id AND stamp_type=:type AND user_id=:user", {
        id: this.params.stamp_setting_id,
        type: this.params.stamp_type,
        user: this.user_id
      })
    }

    return {
      status: 200,
      result: []
    }
  }
}