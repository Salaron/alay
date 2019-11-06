import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

const unitDB = sqlite3.getUnit()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramCheck() {
    if (!(Type.isArray(this.params.selling_list) && Type.isArray(this.params.selling_list) && this.params.selling_list.length > 0)) throw new Error(`input data should be array!`)
  }

  public async execute() {
    const [beforeUserInfo, skillInfo] = await Promise.all([
      this.user.getUserInfo(this.user_id),
      this.user.getRemovableSkillInfo(this.user_id)
    ])
    let gainCoins = 0
    let availableSkills: any = {}
    for (let skill of skillInfo.owning_info) {
      availableSkills[skill.unit_removable_skill_id] = skill.total_amount - skill.equipped_amount
    }

    await Promise.all(this.params.selling_list.map(async (skill: any) => {
      if (!Type.isInt(skill.unit_removable_skill_id)) throw new Error(`ursi is not an int`)
      if (!Type.isInt(skill.amount)) throw new Error(`amount is not an int`)
      if (availableSkills[skill.unit_removable_skill_id] && availableSkills[skill.unit_removable_skill_id] - skill.amount) throw new ErrorCode(1234, "Not enough sis")

      let skillSellInfo = await unitDB.get("SELECT selling_price FROM unit_removable_skill_m WHERE unit_removable_skill_id = :id", {
        id: skill.unit_removable_skill_id
      })
      if (!skillSellInfo) throw new Error(`unit sis #${skill.unit_removable_skill_id} not exists in the database`)

      gainCoins += skillSellInfo.selling_price * skill.amount

      await this.connection.execute("UPDATE user_unit_removable_skill_owning SET total_amount=total_amount - :amount WHERE user_id = :user AND unit_removable_skill_id = :id", {
        amount: skill.amount,
        user: this.user_id,
        id: skill.unit_removable_skill_id
      })
    }))
    await this.connection.execute("UPDATE users SET game_coin=game_coin + :amount WHERE user_id = :user", {
      amount: gainCoins,
      user: this.user_id
    })

    return {
      status: 200,
      result: {
        total: gainCoins,
        reward_box_flag: false,
        before_user_info: beforeUserInfo,
        after_user_info: await this.user.getUserInfo(this.user_id)
      }
    }
  }
}
