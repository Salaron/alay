ALTER TABLE `auth_tokens`
	ADD COLUMN `language` VARCHAR(50) NOT NULL DEFAULT 'ru' AFTER `login_passwd`;
ALTER TABLE `auth_tokens`
	CHANGE COLUMN `expire` `expire` TIMESTAMP NOT NULL DEFAULT current_timestamp() AFTER `token`;
