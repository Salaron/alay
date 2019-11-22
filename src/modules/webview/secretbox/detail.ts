import { TYPE } from "../../../common/type"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

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

      if (Config.server.debug_mode) await this.secretbox.updateSecretboxSettings()
      let secretbox = await this.connection.first("SELECT * FROM secretbox_list WHERE secretbox_id = :id", {
        id: this.params.id
      })
      if (!secretbox) throw new Error("secretbox doesn't exist")

      let template
      let query = `
      SELECT
        cost_id, step_id
      FROM
        secretbox_list
      JOIN secretbox_button ON secretbox_list.secretbox_id = secretbox_button.secretbox_id
      JOIN secretbox_cost ON secretbox_button.button_id = secretbox_cost.button_id
      WHERE secretbox_list.secretbox_id = :id`
      switch (secretbox.secretbox_type) {
        case 0: {
          template = await WebView.getTemplate("secretbox", "default")
          query += " GROUP BY unit_data_file"
          secretbox.honorBox = true
          break
        }
        case 1: {
          template = await WebView.getTemplate("secretbox", "default")
          query += " ORDER BY step_id ASC"
          secretbox.stepBox = true
          break
        }
        case 5: {
          template = await WebView.getTemplate("secretbox", "default")
          query += " ORDER BY cost_id ASC"
          secretbox.stubBox = true
          break
        }
        default: throw new Error("<center><h4>Not implemented yet.</h4></center>")
      }

      let costs = await this.connection.query(query, {
        id: secretbox.secretbox_id
      })

      let costList = []
      for (let i = 0; i < costs.length; i++) {
        let settings = this.secretbox.secretboxSettings[secretbox.secretbox_id][costs[i].cost_id]
        let cost = {
          total: 0,
          default: i === 0,
          label: "",
          rarityList: <any[]>[]
        }
        if (secretbox.stepBox) {
          cost.label = "STEP " + costs[i].step_id
        }

        for (let rarity of settings) {
          cost.total += Object.values(rarity.unit_data_by_id).length

          if (secretbox.stubBox && cost.label.length > 0) {
            cost.label += "/"
          }
          if (secretbox.honorBox || secretbox.stubBox) cost.label += getRarityString(rarity.rarity)

          let rateup = rarity.rateup_unit_ids.map(unitId => {
            let data = rarity.unit_data_by_id[unitId]
            return {
              cardNumber: data.unit_number,
              icon: data.normal_icon_asset,
              skillName: data.skill,
              cardAttribute: getAttributeString(data.attribute)
            }
          })
          let cards = rarity.unit_id!.map(unitId => {
            let data = rarity.unit_data_by_id[unitId]
            return {
              cardNumber: data.unit_number,
              icon: data.normal_icon_asset,
              skillName: data.skill,
              cardAttribute: getAttributeString(data.attribute)
            }
          })

          let result = {
            rarity: getRarityString(rarity.rarity),
            rate: rarity.weight,
            total: Object.values(rarity.unit_data_by_id).length,
            ratePerCard: ((100 - (rarity.rateup_weight && rarity.rateup_weight > 0 && rarity.rateup_unit_ids.length > 0 ? rarity.rateup_weight : 0)) / rarity.unit_id!.length).toFixed(3),
            ratePerRateup: ((rarity.rateup_weight || 0) / rarity.rateup_unit_ids.length).toFixed(3),
            rateup,
            cards
          }
          cost.rarityList.push(result)
        }
        costList.push(cost)
      }

      return {
        status: 200,
        result: await this.webview.compileBodyTemplate(template, this.requestData, {
          secretbox,
          costList,
          pageTitle: secretbox.name,
          scripts: [
            "https://cdn.jsdelivr.net/npm/lazyload@2.0.0-rc.2/lazyload.js",
            "https://cdn.jsdelivr.net/gh/cferdinandi/smooth-scroll/dist/smooth-scroll.polyfills.min.js"
          ]
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
