import { secretboxType, animationType, buttonType } from "../models/secretbox"

export interface ISecretboxM {
  secret_box_id: number
  secret_box_type: number
  name: string
  description: string
  add_gauge: number
  upper_limit: number
  unit_limit_type: number
  start_date: string
  end_date: string
  always_display_flag: 0 | 1
  show_end_date_flag: null | 1
  page_order: number
}

export interface ISecretboxInfo {
  secret_box_id: number
  secret_box_type: secretboxType
  name: string
  description: string
  start_date: string
  end_date: string
  show_end_date?: string
  add_gauge: number
  pon_count: number
  pon_upper_limit: number
  additional_info?: IStepAdditionalInfo
}

export interface ISecretboxAnimationAssets {
  type: animationType
  background_asset: string
  additional_asset_1: string
  additional_asset_2: string
  additional_asset_3: string | undefined
  menu_asset: string
  menu_se_asset: string
}

export interface ISecretboxPage {
  menu_asset: string
  page_order: number
  animation_assets: ISecretboxAnimationAssets
  button_list: ISecretboxButton[]
  secret_box_info: ISecretboxInfo
}

export interface ISecretboxButton {
  secret_box_button_type: buttonType
  cost_list: ISecretboxCost[]
  secret_box_name: string
  balloon_asset?: string
  show_cost?: {
    cost_type: number
    unit_count: number
    amount?: number
  }
}
export interface ISecretboxCost {
  id: number
  payable: boolean
  removable: boolean
  unit_count: number
  type: number
  item_id: number | null,
  amount: number
}

export interface IStepAdditionalInfo {
  secret_box_type: secretboxType
  step: number
  end_step: number
  show_step: number
}

export interface ISecretboxUnitInfo {
  fixRarity: {
    [unitGroupId: number]: number // [unitGroupId] => count
  }
  unitGroup: Array<{
    id: number
    weight: number
    unitIds: number[]
    unitLineUp: number[]
    limitedRateUnits: Array<{
      unitId: number
      rate: string // float with 3 fixed digits
      weight: number
    }>
  }>
}