import { Redis } from "../core/database/redis"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import { costType, secretboxType } from "../models/secretbox"
import { ISecretboxAnimationAssets, ISecretboxButton, ISecretboxInfo, ISecretboxM, ISecretboxPage } from "../typings/secretbox"
import { Utils } from "./utils"

const unitDB = sqlite3.getUnitDB()
const secretboxSVDB = sqlite3.getSecretboxSVDB()

export class Secretbox extends CommonModule {
  private useCache = false
  private userItems: any
  constructor(action: BaseAction) {
    super(action)
  }

  public async getSecretboxPageList(memberCategory: memberCategory): Promise<{ member_category: number, page_list: ISecretboxPage[] }> {
    const secretboxList = await secretboxSVDB.all(`
    SELECT * FROM secret_box_m as box
    JOIN secret_box_page_m as page ON box.secret_box_id = page.secret_box_id
    WHERE start_date <= :date AND end_date > :date AND member_category = :ctg`, {
      date: Utils.toSpecificTimezone(9),
      ctg: memberCategory
    })

    const pageList = <ISecretboxPage[]>(await Promise.all(secretboxList.map(async (secretbox) => {
      const available = await this.isAvailable(secretbox)
      if (!available) return false
      return await this.getSecretboxPage(secretbox)
    }))).filter(secretbox => !!secretbox)

    return {
      member_category: memberCategory,
      page_list: pageList
    }
  }

  /**
   * Compile secretbox page by id
   * @returns `ISecretbox`
   * @returns `false` if this secretbox is not available
   */
  private async getSecretboxPage(secretBoxM: ISecretboxM): Promise<ISecretboxPage> {
    let secretboxPage: ISecretboxPage

    const cachedData = await Redis.get(`Secretbox:Page:${secretBoxM.secret_box_id}`)
    if (cachedData && this.useCache) {
      // use cached data
      secretboxPage = JSON.parse(cachedData)
    } else {
      const [animationAssets, secretboxInfo, buttonList] = await Promise.all([
        this.getAnimationAssets(secretBoxM.secret_box_id, secretBoxM.secret_box_type),
        this.getSecretboxInfo(secretBoxM.secret_box_id),
        this.getButtons(secretBoxM.secret_box_id, secretBoxM.secret_box_type)
      ])

      secretboxPage = {
        menu_asset: animationAssets.menu_asset,
        menu_se_asset: animationAssets.menu_se_asset,
        animation_assets: animationAssets,
        button_list: buttonList,
        secret_box_info: secretboxInfo
      }
      await Redis.set(`Secretbox:Page:${secretBoxM.secret_box_id}`, JSON.stringify(secretboxPage), "ex", 86400)
    }

    // set user pon count
    const userPonCount = await this.getUserPonCount(secretBoxM.secret_box_id)
    secretboxPage.secret_box_info.pon_count = userPonCount

    // update cost status
    for (const button of secretboxPage.button_list) {
      for (const cost of button.cost_list) {
        cost.payable = await this.isPayable(cost.type, cost.item_id, cost.amount)
      }
      // TODO: remove costs with field "removable"
    }

    // TODO: additional secretbox info

    return secretboxPage
  }

  private async getSecretboxInfo(id: number): Promise<ISecretboxInfo> {
    const secretbox: ISecretboxM = await secretboxSVDB.get("SELECT * FROM secret_box_m WHERE secret_box_id = :id", { id })
    if (!secretbox) throw new Error("No data for secretbox id #" + id)

    const secretboxInfo: ISecretboxInfo = {
      secret_box_id: secretbox.secret_box_id,
      secret_box_type: secretbox.secret_box_type,
      name: secretbox.name,
      description: secretbox.description,
      start_date: secretbox.start_date,
      end_date: secretbox.end_date,
      show_end_date: secretbox.show_end_date_flag ? secretbox.end_date : undefined,
      add_gauge: secretbox.add_gauge,
      pon_count: 0,
      pon_upper_limit: secretbox.upper_limit,
      // additional_info: null
    }

    return secretboxInfo
  }

  private async getButtons(id: number, type: number): Promise<ISecretboxButton[]> {
    let buttons: ISecretboxButton[]

    switch (type) {
      case secretboxType.DEFAULT:
      case secretboxType.STUB: {
        const buttonList = await secretboxSVDB.all("SELECT * FROM secret_box_button_m WHERE secret_box_id = :id", { id })
        buttons = await Promise.all(buttonList.map(async (button) => {
          const costList = (await secretboxSVDB.all("SELECT * FROM secret_box_cost_m WHERE secret_box_id = :id AND secret_box_button_type = :buttonType ORDER BY cost_order ASC", {
            id,
            buttonType: button.secret_box_button_type
          })).map(cost => {
            let removable = false
            if (type === secretboxType.DEFAULT && cost.cost_type === 1000) removable = true
            return {
              id: cost.secret_box_cost_id,
              payable: false,
              removable,
              unit_count: cost.unit_count,
              type: cost.cost_type,
              item_id: cost.item_id,
              amount: cost.amount
            }
          })

          // TODO: timelimited ballons
          return {
            secret_box_button_type: button.secret_box_button_type,
            secret_box_name: button.secret_box_name,
            balloon_asset: button.balloon_asset !== null ? button.balloon_asset : undefined,
            cost_list: costList
          }
        }))
        break
      }

      default: throw new Error(`Secretbox type "${type}" is not supported`)
    }

    return buttons
  }

  private async getAnimationAssets(id: number, type: secretboxType): Promise<ISecretboxAnimationAssets> {
    let animationAssetsData
    switch (type) {
      case secretboxType.DEFAULT:
      case secretboxType.STUB:
      case secretboxType.STEP_UP: {
        const secretboxPage = await secretboxSVDB.get("SELECT secret_box_animation_asset_id FROM secret_box_page_m WHERE secret_box_id = :id", {
          id
        })
        animationAssetsData = await secretboxSVDB.get("SELECT * FROM secret_box_animation_asset_m WHERE secret_box_animation_asset_id = :animId", {
          animId: secretboxPage.secret_box_animation_asset_id
        })
        break
      }
      default: throw new Error(`Secretbox type "${type}" is not supported`)
    }

    return <ISecretboxAnimationAssets>{
      type: animationAssetsData.secret_box_animation_type,
      background_asset: animationAssetsData.background_asset,
      additional_asset_1: animationAssetsData.additional_asset_1,
      additional_asset_2: animationAssetsData.additional_asset_2,
      additional_asset_3: animationAssetsData.additional_asset_3 === null ? undefined : animationAssetsData.additional_asset_3,
      menu_asset: animationAssetsData.menu_asset,
      menu_se_asset: animationAssetsData.menu_se_asset
    }
  }

  private async getUserPonCount(secretboxId: number): Promise<number> {
    let pon = await this.connection.first(`SELECT pon_count FROM secretbox_pon WHERE user_id = :user AND secretbox_id = :id`, {
      user: this.userId,
      id: secretboxId
    })
    if (!pon) pon = { pon_count: 0 }
    return pon.pon_count
  }

  private async isAvailable(secretboxM: ISecretboxM): Promise<boolean>
  private async isAvailable(id: number): Promise<boolean>
  private async isAvailable(input: number | ISecretboxM): Promise<boolean> {
    let secretboxM: ISecretboxM
    if (typeof input === "number") {
      secretboxM = await secretboxSVDB.get("SELECT start_date, end_date FROM secret_box_m WHERE secret_box_id = :id", {
        id: input
      })
    } else {
      secretboxM = input
    }
    const currentDate = Utils.toSpecificTimezone(9)
    if (
      secretboxM.start_date > currentDate ||
      secretboxM.end_date <= currentDate
    ) return false
    return true
  }

  private async isPayable(itemType: number, itemId: number | null, amount: number): Promise<boolean> {
    if (!this.userItems) {
      this.userItems = await this.connection.first("SELECT sns_coin, bt_tickets, green_tickets, social_point, game_coin FROM users WHERE user_id = :user", {
        user: this.userId
      })
    }

    switch (itemType) {
      case costType.NON_COST: {
        return true
      }
      case costType.ITEM_TICKET: {
        if (itemId === 1) {
          return this.userItems.green_tickets >= amount
        }
        if (itemId === 5) {
          return this.userItems.bt_tickets >= amount
        }
        // TODO: other tickets
      }
      case costType.GAME_COIN: {
        return this.userItems.game_coin >= amount
      }
      case costType.LOVECA: {
        return this.userItems.sns_coint >= amount
      }
      case costType.FRIEND: {
        return this.userItems.social_point >= amount
      }
    }

    return false
  }
}
