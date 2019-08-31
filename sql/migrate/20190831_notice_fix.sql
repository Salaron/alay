ALTER TABLE `user_notice`
	CHANGE COLUMN `message` `message` TEXT NULL COLLATE 'utf8mb4_general_ci' AFTER `readed`;
