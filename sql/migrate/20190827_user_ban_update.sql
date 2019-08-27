ALTER TABLE `user_banned`
	ADD COLUMN `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp() AFTER `message`,
	ADD COLUMN `insert_date` TIMESTAMP NULL DEFAULT NULL AFTER `insert_date`;