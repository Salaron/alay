import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"
import { secretboxType } from "../../../models/secretbox"

const secretboxSVDB = sqlite3.getSecretboxSVDB()

interface IButtonTypeUnitLineUp {
  secret_box_button_type: number
  secret_box_name: string
  unit_line_up: IUnitLineUp
}

interface IUnitLineUp {
  rarity: number
  unit_ids: number[]
}

export default class extends ApiAction {
  public requestType = REQUEST_TYPE.SINGLE
  public permission = PERMISSION.XMC
  public requiredAuthLevel = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      secret_box_id: TYPE.INT
    }
  }

  public async execute() {
    // select a page because it should be already cached in redis
    const secretboxPage = await this.secretbox.getSecretboxPage(this.params.secret_box_id)

    let buttonTypeUnitLineUp: IButtonTypeUnitLineUp[] | undefined
    let unitLineUp: IUnitLineUp[] | undefined
    switch (secretboxPage.secret_box_info.secret_box_type) {
      case secretboxType.STUB: {
        const buttons = await secretboxSVDB.all(`
        SELECT DISTINCT
          button.secret_box_button_type, button.secret_box_name
        FROM
          secret_box_button_m as button
          JOIN secret_box_button_type_unit_group_m as unit_group
            ON button.secret_box_button_type = unit_group.secret_box_button_type AND button.secret_box_id = unit_group.secret_box_id
        WHERE
          button.secret_box_id = :id`, {
          id: this.params.secret_box_id
        })

        buttonTypeUnitLineUp = await Promise.all(buttons.map(async button => {
          const unitInfo = await this.secretbox.getSecretboxUnitInfo(this.params.secret_box_id, button.secret_box_button_type)

          button.unit_line_up = unitInfo.unitGroup.map(group => {
            return {
              rarity: group.id,
              unit_ids: group.unitLineUp
            }
          })
          button.unit_line_up = this.correctRarityOrder(button.unit_line_up)
          return button
        }))
        break
      }

      case secretboxType.DEFAULT: {
        const unitInfo = await this.secretbox.getSecretboxUnitInfo(this.params.secret_box_id)
        unitLineUp = unitInfo.unitGroup.map(group => {
          return {
            rarity: group.id,
            unit_ids: group.unitLineUp
          }
        })
        unitLineUp = this.correctRarityOrder(unitLineUp)
        break
      }
      default: throw new ErrorAPI("Secretbox type not supported")
    }

    return {
      status: 200,
      result: {
        button_type_unit_line_up: buttonTypeUnitLineUp,
        unit_line_up: unitLineUp,
        url: `/webview.php/secretbox/detail?id=${this.params.secret_box_id}&no_title=1`,
      }
    }
  }

  private correctRarityOrder(lineUpArray: IUnitLineUp[]) {
    let rarityMap: { [rarity: number]: IUnitLineUp } = {}
    for (const lineUp of lineUpArray) {
      rarityMap[lineUp.rarity] = lineUp
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
