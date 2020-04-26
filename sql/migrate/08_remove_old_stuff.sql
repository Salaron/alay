/* Remember: never do like that when you'll work in some company */
ALTER TABLE `secretbox_pon`
	DROP FOREIGN KEY `FK_secretbox_pon_sb`;
DROP TABLE `secretbox_step_up_settings`;
DROP TABLE `secretbox_cost`;
DROP TABLE `secretbox_button`;
DROP TABLE `secretbox_list`;
DROP TABLE `error_log`;
DROP TABLE `auth_tokens`;
DROP TABLE `auth_recovery_codes`;

ALTER TABLE `units`
	CHANGE COLUMN `unit_skill_exp` `unit_skill_exp` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0 AFTER `unit_skill_level`;
