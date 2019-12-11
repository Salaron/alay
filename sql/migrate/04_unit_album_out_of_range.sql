ALTER TABLE `user_unit_album`
	CHANGE COLUMN `highest_love_per_unit` `highest_love_per_unit` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `all_max_flag`;
