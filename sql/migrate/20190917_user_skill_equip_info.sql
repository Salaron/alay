ALTER TABLE `user_unit_removable_skill_owning`
  ADD COLUMN `equipped_amount` SMALLINT NOT NULL DEFAULT '0' AFTER `total_amount`;
UPDATE
  user_unit_removable_skill_owning AS o 
SET
  equipped_amount = (
    SELECT
      COUNT(*) 
    FROM (
        user_unit_removable_skill_equip e 
        JOIN
          units 
          ON units.unit_owning_user_id = e.unit_owning_user_id
      )
    WHERE e.unit_removable_skill_id = o.unit_removable_skill_id AND units.user_id = o.user_id
);
DROP VIEW `v_units_not_locked`;