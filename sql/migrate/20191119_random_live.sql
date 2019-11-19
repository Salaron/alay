CREATE TABLE `user_live_random` (
	`user_id` INT(10) UNSIGNED NOT NULL,
	`attribute` TINYINT(1) NOT NULL,
	`difficulty` TINYINT(1) NOT NULL,
	`member_category` TINYINT(4) NOT NULL,
	`token` VARCHAR(64) NOT NULL,
	`live_difficulty_id` MEDIUMINT(9) NOT NULL,
	`in_progress` TINYINT(4) NOT NULL DEFAULT 0,
	PRIMARY KEY (`user_id`, `attribute`, `difficulty`, `member_category`),
	CONSTRAINT `FK_user_live_random_uid` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE
) COLLATE='utf8mb4_general_ci' ENGINE=InnoDB;
