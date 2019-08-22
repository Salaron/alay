ALTER TABLE `user_notice`
	ADD COLUMN `type_id` INT UNSIGNED NOT NULL AFTER `receiver_id`;
