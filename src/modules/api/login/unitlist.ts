import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    return {
      status: 200,
      result: {
        member_category_list: [
          this.generateMemberCategory(1),
          this.generateMemberCategory(2)
        ]
      }
    }
  }

  private generateMemberCategory(id: number) {
    return {
      member_category: id,
      unit_initial_set: this.generateSet(id === 1 ? Config.modules.unitSelect.museCenterUnits : Config.modules.unitSelect.aqoursCenterUnits, id)
    }
  }

  private generateSet(centerUnits: any, membercategory: number) {
    let set = []
    for (let i = 0; i < centerUnits.length; i++) {
      set.push({
        unit_initial_set_id: parseInt(membercategory.toString() + i),
        unit_list: this.generateUnitList(centerUnits[i]),
        center_unit_id: centerUnits[i]
      })
    }
    return set
  }

  private generateUnitList(centerUnitID: number) {
    return [1391, 1529, 1527, 1487, centerUnitID, 1486, 1488, 1528, 1390].map(id => {
      return {
        unit_id: id,
        is_rank_max: false
      }
    })
  }
}
