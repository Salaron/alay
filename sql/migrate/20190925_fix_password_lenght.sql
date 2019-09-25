ALTER TABLE `users`
	CHANGE COLUMN `password` `password` VARCHAR(64) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci' AFTER `partner_unit`;
