ALTER TABLE `user_live_progress`
	ADD COLUMN `lp_factor` SMALLINT NOT NULL DEFAULT '1' AFTER `start_time`;
ALTER TABLE `request_log`
	CHANGE COLUMN `request` `request` LONGTEXT NOT NULL DEFAULT '' COLLATE 'utf8mb4_unicode_ci' AFTER `user_id`;
ALTER TABLE `reward_table`
	DROP COLUMN `attribute`,
	DROP COLUMN `rarity`,
	DROP COLUMN `is_support`,
	DROP COLUMN `collected`;