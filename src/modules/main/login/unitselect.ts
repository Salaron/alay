import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL, TYPE } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
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
    return {
      mgd: TYPE.INT,
      unit_initial_set_id: TYPE.INT
    }
  }
  public paramCheck() {
    if (![1, 2].includes(this.params.mgd)) throw new Error(`Invalid mgd`)
    if (this.params.unit_initial_set_id % 10 < 0 || this.params.unit_initial_set_id % 10 > 9) throw new Error(`Invalid set id`)
  }

  public async execute() {
    const unit = new Unit(this.connection)

    let ts = await this.connection.first("SELECT tutorial_state FROM users WHERE user_id=:user", { user: this.user_id })
    if (ts.tutorial_state != 1) throw new Error(`someting wronth with tutorial state`)

    let titleId = 1
    let leader = Config.modules.unitSelect.museCenterUnits[this.params.unit_initial_set_id % 10]
    if (this.params.mgd === 2) {
      titleId = 23
      leader = Config.modules.unitSelect.aqoursCenterUnits[this.params.unit_initial_set_id % 10]
    }
    let unitIds = [1391, 1529, 1527, 1487, leader, 1486, 1488, 1528, 1390, 1391, 1529]
    let uouid: any[] = []
    await unitIds.forEachAsync(async u => {
      uouid.push(await unit.addUnit(this.user_id, u))
    })
    await this.connection.query("UPDATE users SET tutorial_state=-1, partner_unit=:partner, setting_award_id=:award WHERE user_id=:user", {
      partner: uouid[4].unit_owning_user_id,
      user: this.user_id,
      award: titleId
    })

    // Insert deck and 9 units
    await this.connection.query("INSERT INTO user_unit_deck VALUES (:user, 1, 'Team A')", { user: this.user_id })
    await this.connection.query("INSERT INTO user_unit_deck_slot VALUES (:user, 1, 1, :s1),(:user, 1, 2, :s2),(:user, 1, 3, :s3),(:user, 1, 4, :s4),(:user, 1, 5, :s5),(:user, 1, 6, :s6),(:user, 1, 7, :s7),(:user, 1, 8, :s8),(:user, 1, 9, :s9);",{
      user: this.user_id,
      s1: uouid[0].unit_owning_user_id,
      s2: uouid[1].unit_owning_user_id,
      s3: uouid[2].unit_owning_user_id,
      s4: uouid[3].unit_owning_user_id,
      s5: uouid[4].unit_owning_user_id,
      s6: uouid[5].unit_owning_user_id,
      s7: uouid[6].unit_owning_user_id,
      s8: uouid[7].unit_owning_user_id,
      s9: uouid[8].unit_owning_user_id,
    })

    return {
      status: 200,
      result: {
        unit_id: unitIds
      }
    }
  }
}