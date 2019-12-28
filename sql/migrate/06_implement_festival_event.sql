DROP TABLE `event_festival_live_progress`;
ALTER TABLE `user_live_progress`
	ADD COLUMN `event_id` INT NULL DEFAULT NULL AFTER `mods`;
