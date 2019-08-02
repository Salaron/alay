ALTER TABLE `event_ranking`
	ADD COLUMN `token_point` INT(10) UNSIGNED NOT NULL DEFAULT '0' AFTER `event_point`,
	CHANGE COLUMN `deck` `deck` TEXT NULL AFTER `token`;
ALTER TABLE `user_live_progress`
	ADD COLUMN `lp_factor` TINYINT(1) UNSIGNED NOT NULL DEFAULT '1' AFTER `deck_id`;