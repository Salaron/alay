ALTER TABLE `user_live_progress`
	ADD COLUMN `mods` INT NOT NULL DEFAULT '0' AFTER `lp_factor`;
UPDATE `user_live_log`
  SET mods = 0;
ALTER TABLE `user_live_log`
	CHANGE COLUMN `mods` `mods` INT NOT NULL DEFAULT 0 AFTER `live_setting_ids`;