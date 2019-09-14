ALTER TABLE `user_live_log`
  CHANGE COLUMN `live_setting_id` `live_setting_id` INT NULL AFTER `user_id`,
	ADD COLUMN `live_setting_ids` VARCHAR(50) NULL DEFAULT NULL AFTER `live_setting_id`,
	ADD COLUMN `mods` VARCHAR(50) NOT NULL DEFAULT '' AFTER `live_setting_ids`,
	ADD COLUMN `is_event` TINYINT NOT NULL DEFAULT '0' AFTER `mods`;
