ALTER TABLE `user_live_progress`
	ALTER `live_setting_id` DROP DEFAULT;
ALTER TABLE `user_live_progress`
	CHANGE COLUMN `live_setting_id` `live_setting_id` INT(10) NULL AFTER `live_difficulty_id`;
CREATE TABLE `user_custom_live_status` (
	`user_id` INT(10) UNSIGNED NOT NULL,
	`custom_live_id` INT(11) NOT NULL,
	`hi_score` INT(11) UNSIGNED NOT NULL,
	`hi_combo` INT(11) UNSIGNED NOT NULL,
	`complete_cnt` INT(11) UNSIGNED NOT NULL,
	`score_rank` TINYINT(1) UNSIGNED NOT NULL,
	`combo_rank` TINYINT(1) UNSIGNED NOT NULL,
	`complete_rank` TINYINT(1) UNSIGNED NOT NULL,
	`status` TINYINT(1) UNSIGNED NOT NULL,
	`insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
	INDEX `FK__users` (`user_id`),
	CONSTRAINT `FK__users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE
) COLLATE='utf8_general_ci' ENGINE=InnoDB;
