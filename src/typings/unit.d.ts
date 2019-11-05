type unitRarity = 1 | 2 | 3 | 4 | 5
type unitAttribute = 1 | 2 | 3 | 5

interface supportUnitData {
  name: string
  attribute: number
  rarity: number
  merge_cost: number
  sale_price: number
  exp: number
  skill_exp: number
}

interface detailUnitData {
  unit_owning_user_id: number
  unit_id: number
  exp: number
  next_exp: number
  level: number
  max_level: number
  rank: number
  max_rank: number
  love: number
  max_love: number
  unit_skill_level: number
  max_hp: number
  favorite_flag: boolean
  display_rank: number
  unit_skill_exp: number
  skill_level: number
  unit_removable_skill_capacity: number
  max_removable_skill_capacity: number
  attribute: number
  smile: number
  cute: number
  cool: number
  is_rank_max: boolean
  is_love_max: boolean
  is_level_max: boolean
  is_skill_level_max: boolean
  is_removable_skill_capacity_max: boolean
  is_support_member: boolean
  removable_skill_ids: number[]
  insert_date: string
  total_smile: number
  total_cute: number
  total_cool: number
  total_hp: number
}

interface IAddUnitResult extends Omit<detailUnitData, "unit_owning_user_id"> {
  unit_owning_user_id: number | null
  unit_owning_ids: number[]
  new_unit_flag: boolean
  unit_rarity_id: unitRarity
}
