ALTER TABLE `webview_announce`
	CHANGE COLUMN `announce` `body` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci' AFTER `description`;
