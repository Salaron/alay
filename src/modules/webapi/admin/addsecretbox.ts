import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"
import { secretboxType, buttonType } from "../../../models/secretbox"

const secretboxDB = sqlite3.getSecretboxSVDB()

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.ADMIN

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      secretboxInfo: {
        secretboxName: TYPE.STRING,
        secretboxType: TYPE.INT,
        startDate: TYPE.STRING,
        endDate: TYPE.STRING,
        memberCategory: TYPE.INT,
        alwaysDisplayFlag: TYPE.INT,
        showEndDateFlag: TYPE.INT
      },
      // assets,
      // buttons,
      // groups,
      // guarantee
    }
  }

  public paramCheck() {
    if (this.params.assets.length === 0) throw new ErrorAPI("Оформление отсутствует")
    if (this.params.buttons.length === 0) throw new ErrorAPI("У коробки нет кнопок?")
    if (this.params.groups.length === 0) throw new ErrorAPI("Карты не выбраны")
    if (this.params.secretboxInfo.secretboxType === secretboxType.STUB) {
      if (this.params.buttons.length !== 3) throw new ErrorAPI("Для данной коробки требуется 3 кнопки!")
    }
  }

  public async execute() {
    let gauge = 10
    if (this.params.secretboxInfo.secretboxType === 5) gauge = 0

    await secretboxDB.exec("BEGIN TRANSACTION")
    try {
      const result = await secretboxDB.run(`
      INSERT INTO
        secret_box_m (secret_box_type, name, add_gauge, upper_limit, unit_limit_type, start_date, end_date, always_display_flag, show_end_date_flag)
      VALUES
        (:type, :name, :gauge, :limit, :limitType, :startDate, :endDate, :alwaysDisplay, :showEndDate)
      `, {
        type: this.params.secretboxInfo.secretboxType,
        name: this.params.secretboxInfo.secretboxName,
        gauge,
        limit: 0, // default
        limitType: 0, // default
        startDate: this.params.secretboxInfo.startDate,
        endDate: this.params.secretboxInfo.endDate,
        alwaysDisplay: this.params.secretboxInfo.alwaysDisplayFlag,
        showEndDate: this.params.secretboxInfo.showEndDateFlag
      })
      const secretboxID = result.lastID

      let lastAnimationAssetID = 0
      for (const asset of this.params.assets) {
        const result = await secretboxDB.run(`
        INSERT INTO secret_box_animation_asset_m (
          secret_box_animation_type, background_asset, additional_asset_1,
          additional_asset_2, additional_asset_3, menu_asset, menu_se_asset
        )
        VALUES (:animationType, :background, :navi, :title, :appeal, :menu, :menuSe)`, asset)
        lastAnimationAssetID = result.lastID
      }
      await secretboxDB.run(`
      INSERT INTO secret_box_page_m (
        secret_box_id, page_order, secret_box_animation_asset_id, member_category
      ) VALUES (:secretboxID, :pageOrder, :lastAnimationAssetID, :memberCategory)`, {
        secretboxID,
        pageOrder: Math.floor(Math.random() * 100),
        lastAnimationAssetID,
        memberCategory: this.params.secretboxInfo.memberCategory
      })

      for (const button of this.params.buttons) {
        if (button.balloon === "assets/image/secretbox/balloon/")
          button.balloon = null
        await secretboxDB.run(`
        INSERT INTO secret_box_button_m (
          secret_box_id, secret_box_button_type, secret_box_name, balloon_asset
        ) VALUES (:secretboxID, :type, :name, :balloon)`, {
          secretboxID,
          type: button.type,
          name: button.name,
          balloon: button.balloon
        })
        for (const cost of button.costs) {
          await secretboxDB.run(`
          INSERT INTO secret_box_cost_m (
            secret_box_id, secret_box_button_type, cost_order, unit_count, cost_type, item_id, amount, hide_flag
          ) VALUES (:secretboxID, :buttonType, :order, :unitCount, :costType, :itemID, :amount, :hide)`, {
            secretboxID,
            buttonType: button.type,
            order: 1,
            unitCount: cost.cardCount,
            costType: cost.type,
            itemID: cost.itemId,
            amount: cost.amount,
            hide: cost.hideFlag
          })
        }
      }

      for (const group of this.params.groups) {
        if (this.params.secretboxInfo.secretboxType === secretboxType.STUB) {
          await secretboxDB.run(`
            INSERT INTO secret_box_button_type_unit_group_m (
              secret_box_id, unit_group_id, secret_box_button_type, weight
            ) VALUES (:secretboxID, :rarity, :type, :weight)`, {
            secretboxID,
            rarity: group.rarity,
            type: group.buttonType,
            weight: group.weight
          })
        } else {
          await secretboxDB.run(`
            INSERT INTO secret_box_unit_group_m (
              secret_box_id, unit_group_id, weight
            ) VALUES (:secretboxID, :rarity, :weight)`, {
            secretboxID,
            rarity: group.rarity,
            weight: group.weight
          })
        }


        for (const family of group.familyList) {
          await secretboxDB.run(`
          INSERT INTO secret_box_unit_family_m (
            secret_box_id, unit_group_id, weight, query
          ) VALUES (:secretboxID, :rarity, :weight, :query)`, {
            secretboxID,
            rarity: group.rarity,
            weight: family.weight,
            query: family.query
          })
        }
      }

      for (const guarantee of this.params.guarantee) {
        await secretboxDB.run(`
        INSERT INTO secret_box_fix_rarity_m (
          secret_box_id, unit_group_id, fix_rarity_count
        ) VALUES (:secretboxID, :rarity, :count)`, {
          secretboxID,
          rarity: guarantee.rarity,
          count: guarantee.count
        })
      }
      await secretboxDB.exec("COMMIT")

      return {
        status: 200,
        result: {
          secretboxID
        }
      }
    } catch (err) {
      await secretboxDB.exec("ROLLBACK")
      throw err
    }
  }
}
