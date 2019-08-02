interface liveData {
  c_rank_score: number
  b_rank_score: number
  a_rank_score: number
  s_rank_score: number
  c_rank_combo: number
  b_rank_combo: number
  a_rank_combo: number
  s_rank_combo: number
  c_rank_complete: number
  b_rank_complete: number
  a_rank_complete: number
  s_rank_complete: number
  difficulty: number
  ac_flag: number
  swing_flag: number
  live_setting_id: number
  live_difficulty_id: number
  random_flag: number
  capital_value: number
  capital_type: number
  marathon_live: boolean
  score_rank_info: rankInfo[]
  combo_rank_info: rankInfo[]
  complete_rank_info: rankInfo[]
}
interface rankInfo {
  rank: number
  rank_min: number
  rank_max: number
}