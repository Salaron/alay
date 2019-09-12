CREATE TABLE `user_live_log` (
	`user_id` INT(10) UNSIGNED NOT NULL,
	`live_setting_id` INT(11) NOT NULL,
	`live_difficulty_id` INT(11) NULL DEFAULT NULL,
	`score` INT(11) NOT NULL,
	`combo` INT(11) NOT NULL,
	`combo_rank` INT(11) NOT NULL,
	`score_rank` INT(11) NOT NULL,
	`insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
	INDEX `FK_user_live_log` (`user_id`),
	CONSTRAINT `FK_user_live_log` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE
) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;
