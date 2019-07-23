import { Connection } from "../core/database"

export class Unit {
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }
  
  public static parseUnitData(unitData: any) {
    return {
      unit_owning_user_id: unitData.unit_owning_user_id,
      unit_id: unitData.unit_id,
      exp: unitData.exp,
      next_exp: unitData.next_exp,
      level: unitData.level,
      max_level: unitData.max_level,
      rank: unitData.rank,
      max_rank: unitData.max_rank,
      love: unitData.love,
      max_love: unitData.max_love,
      unit_skill_level: unitData.unit_skill_level,
      unit_skill_exp: unitData.unit_skill_exp,
      max_hp: unitData.max_hp,
      unit_removable_skill_capacity: unitData.removable_skill_capacity,
      favorite_flag: (unitData.favorite_flag == 1),
      display_rank: unitData.display_rank,
      is_rank_max: unitData.rank >= unitData.max_rank,
      is_love_max: unitData.love >= unitData.max_love,
      is_level_max: unitData.level >= unitData.max_level,
      is_skill_level_max: unitData.unit_skill_level >= unitData.max_skill_level,
      is_removable_skill_capacity_max: unitData.removable_skill_capacity >= unitData.max_removable_skill_capacity,
      insert_date: Utils.parseDate(unitData.insert_date)
    }
  }
}
(global as any).Unit = Unit