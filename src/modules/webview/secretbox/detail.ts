import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../core/requestData"
import RequestData from "../../../core/requestData"
import { WebView } from "../../../common/webview"
import { TYPE } from "../../../common/type"
import { Secretbox } from "../../../common/secretbox"

function getRarityString(rarity: number) {
  switch (rarity) {
    case 1: return "N"
    case 2: return "R"
    case 3: return "SR"
    case 4: return "UR"
    case 5: return "SSR"
    default: return "Unknown"
  }
}
function getAttributeString(attribute: number) {
  switch (attribute) {
    case 1: return "Smile"
    case 2: return "Pure"
    case 3: return "Cool"
    case 5: return "Any"
  }
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

  public async execute() {
    try {
      if (isNaN(parseInt(this.params.id))) throw new Error("id should be int")
      const secretboxModule = new Secretbox(this.connection)

      let secretbox = await this.connection.first("SELECT * FROM secretbox_list WHERE secretbox_id = :id", {
        id: this.params.id
      })
      if (!secretbox) throw new Error("secretbox doesn't exist")

      let template
      switch (secretbox.secretbox_type) {
        case 0: {
          template = await WebView.getTemplate("secretbox", "honor")
          break
        }
        case 1: {
          template = await WebView.getTemplate("secretbox", "stepup")
          break
        }
        default: throw new Error("<center><h4>Not implemented yet.</h4></center>")
      }

      let costs = await this.connection.query(`
      SELECT
        cost_id
      FROM
        secretbox_list
      JOIN secretbox_button ON secretbox_list.secretbox_id = secretbox_button.secretbox_id
      JOIN secretbox_cost ON secretbox_button.button_id = secretbox_cost.button_id
      WHERE secretbox_list.secretbox_id = :id GROUP BY unit_data_file`, {
        id: secretbox.secretbox_id
      })

      let rarityList = []
      let total = 0

      for (let cost of costs) {
        let settings = secretboxModule.secretboxSettings[secretbox.secretbox_id][cost.cost_id]

        for (let rarity of settings) {
          total += Object.values(rarity.unit_data_by_id).length

          let rateup = rarity.rateup_unit_ids.map(unitId => {
            let data = rarity.unit_data_by_id[unitId]
            return {
              cardNumber: data.unit_number,
              unitName: data.name,
              skillName: data.skill,
              cardAttribute: getAttributeString(data.attribute)
            }
          })
          let cards = rarity.unit_id!.map(unitId => {
            let data = rarity.unit_data_by_id[unitId]
            return {
              cardNumber: data.unit_number,
              unitName: data.name,
              skillName: data.skill,
              cardAttribute: getAttributeString(data.attribute)
            }
          })
          rarityList.push({
            rarity: getRarityString(rarity.rarity),
            rate: rarity.weight,
            total: Object.values(rarity.unit_data_by_id).length,
            ratePerCard: ((100 - (rarity.rateup_weight || 0)) / Object.values(rarity.unit_data_by_id).length).toFixed(3),
            ratePerRateup: ((rarity.rateup_weight || 0) / rarity.rateup_unit_ids.length).toFixed(3),
            rateup,
            cards
          })
        }
      }

      return {
        status: 200,
        result: template({
          secretbox,
          rarityList,
          total,
          headers: JSON.stringify(this.requestData.getWebapiHeaders())
        })
      }

    } catch (err) {
      return {
        status: 500,
        result: err.message
      }
    }
  }
}
