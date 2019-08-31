import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const museCenter = Config.modules.unitSelect.museCenterUnits
    const aqoursCenter = Config.modules.unitSelect.aqoursCenterUnits

    return {
      status: 200,
      result: {
        member_category_list: [
          {
            member_category: 1,
            unit_initial_set: [
              { unit_initial_set_id: 10, unit_list: [1391, 1529, 1527, 1487, museCenter[0], 1486, 1488, 1528, 1390], center_unit_id: museCenter[0] },
              { unit_initial_set_id: 11, unit_list: [1391, 1529, 1527, 1487, museCenter[1], 1486, 1488, 1528, 1390], center_unit_id: museCenter[1] },
              { unit_initial_set_id: 12, unit_list: [1391, 1529, 1527, 1487, museCenter[2], 1486, 1488, 1528, 1390], center_unit_id: museCenter[2] },
              { unit_initial_set_id: 13, unit_list: [1391, 1529, 1527, 1487, museCenter[3], 1486, 1488, 1528, 1390], center_unit_id: museCenter[3] },
              { unit_initial_set_id: 14, unit_list: [1391, 1529, 1527, 1487, museCenter[4], 1486, 1488, 1528, 1390], center_unit_id: museCenter[4] },
              { unit_initial_set_id: 15, unit_list: [1391, 1529, 1527, 1487, museCenter[5], 1486, 1488, 1528, 1390], center_unit_id: museCenter[5] },
              { unit_initial_set_id: 16, unit_list: [1391, 1529, 1527, 1487, museCenter[6], 1486, 1488, 1528, 1390], center_unit_id: museCenter[6] },
              { unit_initial_set_id: 17, unit_list: [1391, 1529, 1527, 1487, museCenter[7], 1486, 1488, 1528, 1390], center_unit_id: museCenter[7] },
              { unit_initial_set_id: 18, unit_list: [1391, 1529, 1527, 1487, museCenter[8], 1486, 1488, 1528, 1390], center_unit_id: museCenter[8] }
            ]
          },
          {
            member_category: 2,
            unit_initial_set: [
              { unit_initial_set_id: 20, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[0], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[0] },
              { unit_initial_set_id: 21, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[1], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[1] },
              { unit_initial_set_id: 22, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[2], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[2] },
              { unit_initial_set_id: 23, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[3], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[3] },
              { unit_initial_set_id: 24, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[4], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[4] },
              { unit_initial_set_id: 25, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[5], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[5] },
              { unit_initial_set_id: 26, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[6], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[6] },
              { unit_initial_set_id: 27, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[7], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[7] },
              { unit_initial_set_id: 28, unit_list: [1391, 1529, 1527, 1487, aqoursCenter[8], 1486, 1488, 1528, 1390], center_unit_id: aqoursCenter[8] }
            ]
          }
        ]
      }
    }
  }
}