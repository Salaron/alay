ALTER TABLE `user_unit_removable_skill_owning` 
	ADD INDEX `user_skill_owning_index` (`user_id`, `unit_removable_skill_id`);
ALTER TABLE `user_unit_removable_skill_equip` 
	ADD INDEX `user_skill_equip_index` (`unit_owning_user_id`, `unit_removable_skill_id`);
ALTER TABLE `units` 
	ADD INDEX `unit_owning_user_id_index` (`unit_owning_user_id`);
ALTER TABLE `users` 
	ADD INDEX `user_id_index` (`user_id`);
ALTER TABLE `reward_table` 
	ADD INDEX `incentive_user_id` (`user_id`, `incentive_id`);