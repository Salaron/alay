type liveAttibute = 1 | 2 | 3

interface generateRankInfoInput {
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
  [rank: string]: number
}
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
  custom_live_id?: number
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

interface liveInfo {
  live_difficulty_id: number
  is_random: boolean
  ac_flag: number
  swing_flag: number
}
interface scoreInfo {
  score: number
  max_combo: number
  perfect_cnt: number
  great_cnt: number
  good_cnt: number
  bad_cnt: number
  miss_cnt: number
}

interface writeToLogResult {
  live_setting_id?: number
  live_setting_ids?: string
  mods?: number
  is_event: boolean
  score: number
  combo: number
  combo_rank: number
  score_rank: number
}

interface liveDataCache {
  [lsid: number]: {
    difficulty: number
    trackId: number
    attribute: liveAttibute
    memberCategory: memberCategory
  }
}
