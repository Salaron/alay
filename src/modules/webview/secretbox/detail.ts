import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"
import { secretboxType } from "../../../models/secretbox"
import { Redis } from "../../../core/database/redis"

const secretboxSVDB = sqlite3.getSecretboxSVDB()
const unitDB = sqlite3.getUnitDB()

interface IButton {
  name: string
  type: number
  rarityList: IRarity[]
}
interface IRarity {
  id: number
  name: "UR" | "SSR" | "SR" | "R" | "N"
  rate: string | number
  limitedRateUnits: IUnit[]
  units: IUnit[]
}
interface IUnit {
  unitNumber: number
  name: string
  skillName: string
  attribute: string
  rate: number | string
}

interface IUpdateDetailResult {
  rarityList: IRarity[]
  buttonType: IButton[]
  pageTitle: string
  type: secretboxType
}
export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      id: TYPE.STRING
    }
  }
  public paramCheck() {
    this.params.id = parseInt(this.params.id)
    if (isNaN(this.params.id)) throw new ErrorAPI("Invalid param")
  }

  public async execute() {
    const i18n = await this.i18n.getStrings()

    let detailDataString = await Redis.get("Secretbox:webviewDetail:" + this.params.id)
    let detailData: IUpdateDetailResult
    if (detailDataString === null || Config.server.debug_mode) {
      detailData = await this.updateDetailCache()
    } else if (Type.isString(detailDataString)) {
      detailData = JSON.parse(detailDataString)
    }

    return {
      status: 200,
      result: await this.webview.renderTemplate("secretbox", "detail", {
        i18n,
        ignoreWebviewStyle: true,
        noTitle: this.params.no_title,
        ...detailData!
      })
    }
  }

  private async updateDetailCache() {
    const page = await this.secretbox.getSecretboxPage(this.params.id)
    let result: IUpdateDetailResult = {
      rarityList: [],
      buttonType: [],
      pageTitle: page.secret_box_info.name,
      type: page.secret_box_info.secret_box_type
    }

    switch (page.secret_box_info.secret_box_type) {
      case secretboxType.DEFAULT: {
        result.rarityList = await this.getRarityList(page.secret_box_info.secret_box_id)
        break
      }

      case secretboxType.STUB: {
        const buttons = await secretboxSVDB.all(`
        SELECT DISTINCT
          button.secret_box_button_type as type, button.secret_box_name as name
        FROM
          secret_box_button_m as button
          JOIN secret_box_button_type_unit_group_m as unit_group
            ON button.secret_box_button_type = unit_group.secret_box_button_type AND button.secret_box_id = unit_group.secret_box_id
        WHERE
          button.secret_box_id = :id`, {
          id: page.secret_box_info.secret_box_id
        })

        result.buttonType = await Promise.all(buttons.map(async button => {
          button.rarityList = await this.getRarityList(page.secret_box_info.secret_box_id, button.type)
          return button
        }))
        break
      }
      default: throw new ErrorAPI("not implemented yet.")
    }
    await Redis.set("Secretbox:webviewDetail:" + this.params.id, JSON.stringify(result), "ex", 8600)
    return result
  }

  private async getRarityList(secretboxId: number, buttonType?: number) {
    const unitInfo = await this.secretbox.getSecretboxUnitInfo(secretboxId, buttonType)
    let rarityList: IRarity[] = []
    for (const group of unitInfo.unitGroup) {
      let rarity: IRarity = {
        id: group.id,
        name: this.getRarityString(group.id),
        rate: group.weight, // TODO
        limitedRateUnits: [],
        units: []
      }

      let limitedRateTotal = 0
      rarity.limitedRateUnits = await Promise.all(group.limitedRateUnits.map(async unit => {
        limitedRateTotal += parseFloat(unit.rate)
        const unitInfo = await unitDB.get("SELECT unit_number, unit_m.name, attribute_id, unit_skill_m.name as skill_name FROM unit_m LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id WHERE unit_id = :id", { id: unit.unitId })
        return {
          unitNumber: unitInfo.unit_number,
          name: unitInfo.name,
          skillName: unitInfo.skill_name || "None",
          attribute: this.getAttributeString(unitInfo.attribute_id),
          rate: unit.rate
        }
      }))

      // remove limited rate units from general pool
      group.unitLineUp = group.unitLineUp.filter(el => !group.limitedRateUnits.map(el2 => el2.unitId).includes(el))
      rarity.units = await Promise.all(group.unitLineUp.map(async unitId => {
        const unitInfo = await unitDB.get("SELECT unit_number, unit_m.name, attribute_id, unit_skill_m.name as skill_name FROM unit_m LEFT JOIN unit_skill_m ON unit_m.default_unit_skill_id = unit_skill_m.unit_skill_id WHERE unit_id = :id", { id: unitId })
        return {
          unitNumber: unitInfo.unit_number,
          name: unitInfo.name,
          skillName: unitInfo.skill_name || "None",
          attribute: this.getAttributeString(unitInfo.attribute_id),
          rate: ((100 - limitedRateTotal) / group.unitLineUp.length).toFixed(3)
        }
      }))
      rarityList.push(rarity)
    }
    return this.correctRarityOrder(rarityList)
  }

  private getRarityString(id: number) {
    switch (id) {
      case 1: return "N"
      case 2: return "R"
      case 3: return "SR"
      case 4: return "UR"
      case 5: return "SSR"
      default: throw new Error("Unkown rarity id: " + id)
    }
  }

  private getAttributeString(id: number) {
    switch (id) {
      case 1: return "Smile"
      case 2: return "Pure"
      case 3: return "Cool"
      case 5: return "All"
      default: throw new Error("Unkown attribute id: " + id)
    }
  }

  private correctRarityOrder(rarityList: IRarity[]) {
    let rarityMap: { [rarity: number]: IRarity } = {}
    for (const rarity of rarityList) {
      rarityMap[rarity.id] = rarity
    }

    let result = []
    if (rarityMap[4]) result.push(rarityMap[4])
    if (rarityMap[5]) result.push(rarityMap[5])
    if (rarityMap[3]) result.push(rarityMap[3])
    if (rarityMap[2]) result.push(rarityMap[2])
    if (rarityMap[1]) result.push(rarityMap[1])
    return result
  }
}