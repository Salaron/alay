import { Connection } from "../core/database_wrappers/mysql"
import { Item } from "./item"
import * as types from "../typings/secretbox"

export class Secretbox {
  protected secretboxCache = {}
  protected secretboxSettings = {}
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async getSecretboxList(userId: number): Promise<types.secretbox[]> {
    let list = await this.connection.query(`SELECT * FROM secretbox_list WHERE (start_date >= :date AND end_date < :date AND enabled = 1) OR enabled = 2`)
    return await Promise.all(list.map(async secretbox => {
      return await this.generateTab(userId, secretbox)
    }))
  }

  private async generateTab(userId: number, secretboxData: types.secretboxData): Promise<types.secretbox> {
    let [buttons, ponData, additionalInfo] = await Promise.all([
      this.generateButtons(userId, secretboxData),
      this.getUserPon(userId, secretboxData.secretbox_id),
      this.generateAdditionalInfo(userId, secretboxData)
    ])

    const tab: types.secretbox = {
      page_title_asset: secretboxData.menu_title_asset,
      url: `/webview.php/secretbox/detail?id=${secretboxData.secretbox_id}`,
      animation_assets: {
        type: secretboxData.animation_type,
        background_asset: secretboxData.bg_asset,
        additional_asset_1: secretboxData.navi_asset,
        additional_asset_2: secretboxData.title_asset,
        additional_asset_3: secretboxData.appeal_asset
      },
      effect_list: [],
      effect_detail_list: [],
      button_list: buttons,
      secret_box_info: {
        member_category: secretboxData.member_category,
        secret_box_id: secretboxData.secretbox_id,
        secret_box_type: secretboxData.secretbox_type,
        name: secretboxData.name,
        description: secretboxData.description,
        start_date: secretboxData.start_date,
        end_date: secretboxData.end_date,
        show_end_date: secretboxData.enabled === 1 ? secretboxData.end_date : undefined,
        add_gauge: secretboxData.add_gauge,
        pon_count: ponData.pon_count,
        pon_upper_limit: secretboxData.upper_limit,
        additional_info: additionalInfo
      }
    }

    return tab
  }

  private async generateButtons(userId: number, secretboxData: types.secretboxData): Promise<types.secretboxButton[]> {
    switch (secretboxData.secretbox_type) {
      case 0: { // default
        const buttons = await this.connection.query(`SELECT * FROM secretbox_button WHERE secretbox_id = :id ORDER BY type ASC LIMIT 3`, {
          id: secretboxData.secretbox_id
        })

        return await Promise.all(buttons.map(async (button: any) => {
          return {
            secret_box_button_type: button.type,
            cost_list: await this.generateCost(button.button_id, userId),
            secret_box_name: secretboxData.name,
            balloon_asset: button.balloon_asset === null ? undefined : button.balloon_asset
          }
        }))
      }
      case 1: { // step up
        throw new Error(`Not implemented yet.`)
      }
      default: throw new Error(`Secretbox type "${secretboxData.secretbox_type}" is not implemented yet.`)
    }
  }
  private async generateCost(userId: number, buttonId: number): Promise<types.secretboxCost[]> {
    const [costs, items] = await Promise.all([
      this.connection.query(`SELECT cost_id, unit_count, amount, item_name FROM secretbox_cost WHERE button_id = :id`, {
        id: buttonId
      }),
      this.connection.first("SELECT sns_coin, green_tickets, bt_tickets, game_coin, social_point FROM users WHERE user_id = :user", {
        user: userId
      })
    ])

    return await Promise.all(costs.map(async cost => {
      const item = Item.nameToType(cost.item_name)
      let payable = false
      if (item.itemType === 3001) payable = items.sns_coin >= cost.amount
      else if (item.itemType === 3000 && item.itemId === 2) payable = items.game_coin >= cost.amount
      else if (item.itemType === 3002 && item.itemId === 3) payable = items.social_point >= cost.amount
      else if (item.itemType === 1000 && item.itemId === 1) payable = items.green_tickets >= cost.amount
      else if (item.itemType === 1000 && item.itemId === 5) payable = items.bt_tickets >= cost.amount

      return {
        id: cost.cost_id,
        payable,
        unit_count: cost.unit_count,
        type: item.itemType,
        item_id: item.itemId,
        amount: cost.amount
      }
    }))
  }

  private async generateAdditionalInfo(userId: number, secretboxData: types.secretboxData) {
    switch (secretboxData.secretbox_type) {
      case 1: { // step up
        const settings = await this.getStepUpSettings(secretboxData.secretbox_id)
        const pon = await this.getUserPon(userId, secretboxData.secretbox_id)

        let currentStep = pon.pon_count + 1
        if (settings.reset_type === 1) currentStep = currentStep % settings.end_step
        if (currentStep === 0) currentStep = settings.end_step

        return <types.stepInfo>{
          secret_box_type: 1,
          step: currentStep,
          end_step: settings.end_step,
          show_step: currentStep,
          term_count: 0,
          step_up_bonus_bonus_item_list: []
        }
      }
      default: return undefined
    }
  }

  private async getStepUpSettings(secretboxId: number): Promise<types.stepUpSettings> {
    const settings = await this.connection.first(`SELECT * FROM secretbox_step_up_settings WHERE secretbox_id = :id`, {
      id: secretboxId
    })
    if (!settings) throw new Error(`Secretbox #${secretboxId} doesn't have step up settings`)
    return settings
  }
  private async getUserPon(userId: number, secretboxId: number): Promise<{ pon_count: number }> {
    let pon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
      user: userId,
      id: secretboxId
    })
    if (!pon) pon = { pon_count: 0 }
    return pon
  }
}
