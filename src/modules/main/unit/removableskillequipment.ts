import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import assert from "assert"
import { User } from "../../../common/user"

const unitDB = sqlite3.getUnit()

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramCheck() {
    assert(
      typeof this.params.equip === "object" && Array.isArray(this.params.equip) &&
      typeof this.params.remove === "object" && Array.isArray(this.params.remove)
      , "Invalid params")
  }

  public async execute() {
    // Remove sis
    await this.params.remove.forEachAsync(async (sis: any) => {
      if (!Type.isInt(sis.unit_owning_user_id)) throw new Error(`uouid should be int`)

      const check = await this.connection.first("SELECT unit_owning_user_id FROM units WHERE user_id = :user AND unit_owning_user_id = :id AND deleted = 0", {
        user: this.user_id,
        id: sis.unit_owning_user_id
      })
      if (!check) throw new ErrorCode(1311, "ERROR_CODE_UNIT_NOT_EXIST")

      await Promise.all([
        this.connection.execute(`DELETE FROM user_unit_removable_skill_equip WHERE unit_owning_user_id = :id AND unit_removable_skill_id = :skill`, {
          id: sis.unit_owning_user_id,
          skill: sis.unit_removable_skill_id
        }),
        this.connection.execute("UPDATE user_unit_removable_skill_owning SET equipped_amount = equipped_amount - 1 WHERE user_id = :user AND unit_removable_skill_id = :skill", {
          user: this.user_id,
          skill: sis.unit_removable_skill_id
        })
      ])
    })

    // Prepare SIS owning info
    const _owningSkill = await new User(this.connection).getRemovableSkillInfo(this.user_id) // tslint:disable-line
    const owningSkill = <any>{}

    for (const skill of _owningSkill.owning_info) {
      owningSkill[skill.unit_removable_skill_id] = skill.total_amount - skill.equipped_amount
      assert(owningSkill[skill.unit_removable_skill_id] >= 0, "Not enough sis [owningCheck]")
    }

    const _skillInfo = await unitDB.all("SELECT unit_removable_skill_id, size FROM unit_removable_skill_m") // tslint:disable-line
    const skillInfo = <any>{}

    for (const skill of _skillInfo) {
      skillInfo[skill.unit_removable_skill_id] = {
        size: skill.size,
        target_ref: skill.target_reference_type,
        target_type: skill.target_type
      }
    }

    // target reference type:
    // 0 -- disabled
    // 1 -- attribute
    // 2 -- unit type
    // 3 -- client-side

    // Insert sis
    await this.params.equip.forEachAsync(async (sis: any) => {
      const sisData = skillInfo[sis.unit_removable_skill_id]
      if (!sisData) throw new Error("Invalid sis id")
      if (!Type.isInt(sis.unit_owning_user_id)) throw new Error(`uouid should be int`)

      const unit = await this.connection.first("SELECT unit_owning_user_id, unit_id, removable_skill_capacity, attribute FROM units WHERE user_id = :user AND unit_owning_user_id = :id AND deleted = 0", {
        user: this.user_id,
        id: sis.unit_owning_user_id
      })
      if (!unit) throw new ErrorCode(1311, "ERROR_CODE_UNIT_NOT_EXIST")

      // Is there a free space for this SIS?
      let spaceAvailable = unit.removable_skill_capacity + 0
      const spaceUsed = await this.connection.query("SELECT unit_removable_skill_id FROM user_unit_removable_skill_equip WHERE unit_owning_user_id=:id", {
        id: sis.unit_owning_user_id
      })
      for (const equipedSIS of spaceUsed) {
        spaceAvailable -= skillInfo[equipedSIS.unit_removable_skill_id].size
      }
      assert(spaceAvailable >= sisData.size, "Not enought space")
      assert(owningSkill[sis.unit_removable_skill_id] - 1 >= 0, "Not enough sis [equip]")

      // now let's check if this sis is valid for this card
      switch (sisData.target_ref) {
        case 1: {
          if (unit.attribute != sisData.target_type) throw new Error("Invalid attribute")
          break
        }
        case 2: {
          const unitType = await unitDB.get("SELECT unit_type_id FROM unit_m WHERE unit_id = :id", { id: unit.unit_id })
          if (unitType.unit_type_id != sisData.target_type) throw new Error("Invalid unit_type")
          break
        }
      }

      // Insert this sis into slot
      await Promise.all([
        this.connection.execute("INSERT INTO user_unit_removable_skill_equip VALUES (:id,:skill)", {
          id: sis.unit_owning_user_id,
          skill: sis.unit_removable_skill_id
        }),
        this.connection.execute("UPDATE user_unit_removable_skill_owning SET equipped_amount = equipped_amount + 1 WHERE user_id = :user AND unit_removable_skill_id = :skill", {
          user: this.user_id,
          skill: sis.unit_removable_skill_id
        })
      ])
    })

    return {
      status: 200,
      result: []
    }
  }
}
