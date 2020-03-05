import assert from "assert"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

const unitDB = sqlite3.getUnitDB()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramCheck() {
    if (!(Type.isArray(this.params.unit_support_list) && Type.isArray(this.params.unit_owning_user_id))) throw new Error(`input data should be array!`)
  }

  public async execute() {
    const noExchangePointList = this.unit.getNoExchangePointList()
    const beforeUserInfo = await this.user.getUserInfo(this.user_id)

    for (const id of this.params.unit_owning_user_id) {
      assert(Type.isInt(id) && id > 0, "uouid should be int")
    }
    for (const support of this.params.unit_support_list) {
      assert(typeof support === "object", "support is not an object")
      assert(Type.isInt(support.amount) && support.amount > 0, "amount should be int")
      assert(Type.isInt(support.unit_id), "unit_id should be int")
      assert(this.unit.getSupportUnitList().includes(support.unit_id), "This is not support unit")
    }

    let gainCoins = 0
    const detail = <any[]>[]
    const seals: any = {
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
    if (this.params.unit_owning_user_id.length > 0) {
      const units = await this.unit.getNotLockedUnits(this.user_id, this.params.unit_owning_user_id)
      if (units.length != this.params.unit_owning_user_id.length) throw new ErrorAPI(1311, "ERROR_CODE_UNIT_NOT_EXIST")

      await Promise.all(units.map(async (unit: any) => {
        const data = await unitDB.get(`
        SELECT U.rarity, L.sale_price FROM unit_m as U JOIN unit_level_up_pattern_m as L ON L.unit_level_up_pattern_id = U.unit_level_up_pattern_id
        WHERE U.unit_id=? AND L.unit_level=?`, [unit.unit_id, unit.level])

        gainCoins += data.sale_price
        detail.push({
          unit_owning_user_id: unit.unit_owning_user_id,
          unit_id: unit.unit_id,
          price: data.sale_price
        })
        if (typeof seals[data.rarity.toString()] === "number" && (!noExchangePointList.includes(unit.unit_id))) {
          seals[data.rarity.toString()] += 1
        }
      }))

      let removeUnitsQuery = "UPDATE units SET deleted = 1 WHERE user_id = :user AND unit_owning_user_id IN (:units)"
      if (Config.modules.unit.removeFromDatabase === true) {
        removeUnitsQuery = "DELETE FROM units WHERE user_id = :user AND unit_owning_user_id IN (:units)"
      }
      await this.connection.execute(removeUnitsQuery, {
        user: this.user_id,
        units: this.params.unit_owning_user_id
      })
    }

    if (this.params.unit_support_list.length > 0) {
      const _owningSupportUnit = await this.user.getSupportUnits(this.user_id) // tslint:disable-line
      const owningSupportUnit = <{ [id: number]: number }>{}
      for (const support of _owningSupportUnit) owningSupportUnit[support.unit_id] = support.amount

      await Promise.all(this.params.unit_support_list.map(async (unit: any) => {
        if (!(unit.unit_id && unit.unit_id in owningSupportUnit && owningSupportUnit[unit.unit_id] >= unit.amount)) throw new ErrorAPI(1311)

        const data = await unitDB.get("SELECT U.rarity, L.sale_price FROM unit_m as U JOIN unit_level_up_pattern_m as L ON L.unit_level_up_pattern_id = U.unit_level_up_pattern_id WHERE U.unit_id=? AND L.unit_level=1;", [unit.unit_id])
        await this.connection.query("UPDATE user_support_unit SET amount=amount-:amount WHERE unit_id=:unit AND user_id=:user;", {
          amount: unit.amount,
          unit: unit.unit_id,
          user: this.user_id
        })
        gainCoins += parseInt(data.sale_price) * unit.amount
      }))
    }

    await this.connection.execute(`UPDATE users SET game_coin = game_coin + :coins WHERE user_id = :user`, {
      coins: gainCoins,
      user: this.user_id
    })
    await this.connection.execute(`INSERT INTO user_exchange_point VALUES (:user,2,:s2),(:user,3,:s3),(:user,4,:s4),(:user,5,:s5) ON DUPLICATE KEY UPDATE exchange_point=exchange_point+VALUES(exchange_point)`, {
      user: this.user_id,
      s2: seals[2],
      s3: seals[3],
      s4: seals[4],
      s5: seals[5]
    })

    const afterUserInfo = await this.user.getUserInfo(this.user_id)
    const skillInfo = await this.user.getRemovableSkillInfo(this.user_id)
    const pointList = <any>[]
    for (const rarity of Object.keys(seals)) {
      if (seals[rarity] > 0) pointList.push({
        rarity: parseInt(rarity),
        exchange_point: seals[rarity]
      })
    }

    return {
      status: 200,
      result: {
        total: gainCoins,
        detail,
        before_user_info: beforeUserInfo,
        after_user_info: afterUserInfo,
        reward_box_flag: false,
        get_exchange_point_list: pointList,
        unit_removable_skill: skillInfo
      }
    }
  }
}
