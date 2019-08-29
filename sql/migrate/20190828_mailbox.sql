ALTER TABLE `users`
	ADD COLUMN `mail` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci' AFTER `language`;
