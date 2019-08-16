CREATE TABLE `exchange_item` (
	`exchange_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`title` VARCHAR(50) NOT NULL DEFAULT '0',
	`amount` INT UNSIGNED NOT NULL DEFAULT 0,
	`item_name` VARCHAR(50) NOT NULL DEFAULT '0',
  `item_id` INT(11) UNSIGNED NULL DEFAULT NULL,
  `max_count` INT(10) UNSIGNED DEFAULT NULL,
  `start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `end_date` TIMESTAMP NULL DEFAULT NULL,
	PRIMARY KEY (`exchange_item_id`)
) COLLATE='utf8mb4_unicode_ci';

CREATE TABLE `exchange_cost` (
	`exchange_item_id` INT UNSIGNED NOT NULL,
	`rarity` INT UNSIGNED NOT NULL,
	`cost_value` INT UNSIGNED NOT NULL,
	CONSTRAINT `FK_exchange_cost` FOREIGN KEY (`exchange_item_id`) REFERENCES `exchange_item` (`exchange_item_id`) ON UPDATE CASCADE ON DELETE CASCADE
) COLLATE='utf8mb4_unicode_ci';

CREATE TABLE `exchange_log` (
	`exchange_item_id` INT UNSIGNED NOT NULL,
	`user_id` INT UNSIGNED NOT NULL,
	`got_item_count` INT NULL,
	CONSTRAINT `FK_exchange_log_item` FOREIGN KEY (`exchange_item_id`) REFERENCES `exchange_item` (`exchange_item_id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `FK_exchange_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) COLLATE='utf8mb4_unicode_ci';