export interface ISecretboxSettings {
  [sbId: number]: ICostSettings
}
export interface ICostSettings {
  [costId: number]: IRarityData[]
}
export interface IRarityData {
  rateup_unit_id?: number[]
  rateup_hidden_unit_id?: number[]
  rateup_weight?: number // 100 - rateup_weight
  unit_id: number[] | null
  unit_type_id: number[] | null
  query: string[] | string | null
  rarity: number
  weight: number
  guarantee?: boolean
  // fields from below should NOT to be used in json
  unit_data_by_id: {
    [unitId: number]: {
      unit_id: number
      unit_number: number
      name: string
      attribute: 1 | 2 | 3 | 5
      skill: string
    }
  }
  rateup_unit_ids: number[]
}

export interface ISecretbox {
  page_title_asset: string
  url: string // webview url
  animation_assets: {
    type: animationType
    background_asset: string
    additional_asset_1: string
    additional_asset_2: string
    additional_asset_3: string | null
  }
  effect_list: ISecretboxEffect[]
  effect_detail_list: ISecretboxEffectDetail[]
  button_list: ISecretboxButton[]
  secret_box_info: {
    member_category?: number
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
    additional_info?: IStepInfo | IKnapsackInfo
  }
}
// additional info
export interface IStepInfo {
  secret_box_type: secretboxType
  step: number
  end_step: number
  show_step: number
  term_count: number
  step_up_bonus_bonus_item_list: []
  reset_type: 0 | 1 | 2
}
export interface IKnapsackInfo {
  secret_box_type: number
  step: number
  term_count: number
  knapsack_select_unit_list: []
  knapsack_selected_unit_list: []
  knapsack_select_unit_type_id_list: []
  knapsack_selected_unit_type_id_list: []
  is_knapsack_reset: boolean
  is_knapsack_select: boolean
  knapsack_rest_count: {
    unit_group_id: number // rarity
    count: number
    rarity_type: number
  }[]
}
// Button
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
  unit_count: number
  type: number
  item_id: number | null,
  amount: number
}
// detail
export interface ISecretboxEffectDetail {
  type: 1 | 6 // 1 -- normal. 6 -- limited
  secret_box_asset_id: number
}
export interface ISecretboxEffect extends ISecretboxEffectDetail {
  start_date: string
  end_date: string
}

export enum buttonType {
  DEFAULT_SINGLE = 1,
  DEFAULT_MULTI = 2,
  MULTI_COST = 3,
  LIMIT_SINGLE = 4,
  LIMIT_MULTI = 5,
  NORMAL_FREE = 6,
  NORMAL_SINGLE = 7,
  NORMAL_MULTI = 8,
  STUB_A = 9,
  STUB_B = 10,
  STUB_C = 11,
  FREE_SINGLE = 12,
  FREE_MULTI = 13
}
export enum secretboxType {
  DEFAULT = 0,
  STEP_UP = 1,
  EXTRA = 2,
  BOX = 3,
  BOX_TYPE = 4,
  STUB = 5,
  SELECT = 6
}
export enum animationType {
  DEFAULT_TYPE_A = 1,
  DEFAULT_TYPE_B = 2,
  SIMPLE = 3,
  SELECT = 4,
  BOX_TYPE_A = 5,
  BOX_TYPE_B = 6
}

export interface IStepUpSettings {
  secretbox_id: number
  reset_type: IStepUpResetType
  start_step: number
  end_step: number
}
export enum IStepUpResetType {
  NO_RESET,
  START_FROM_BEGGINING
}

export interface ISecretboxData {
  secretbox_id: number
  secretbox_type: secretboxType
  member_category: number
  name: string
  description: string
  start_date: string
  end_date: string
  add_gauge: number
  upper_limit: number
  animation_type: animationType
  menu_title_asset: string
  bg_asset: string
  navi_asset: string
  title_asset: string
  appeal_asset: string
  banner_asset_name: string
  banner_se_asset_name: string
  always_visible: 0 | 1
  enabled: 0 | 1 | 2
}
