CREATE TABLE `secretbox_button` (
  `button_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `secretbox_id` int(10) unsigned NOT NULL DEFAULT '0',
  `step_id` int(10) unsigned DEFAULT NULL,
  `type` smallint(5) unsigned NOT NULL COMMENT 'All button types described in common/secretbox.ts',
  `balloon_asset` text,
  PRIMARY KEY (`button_id`),
  KEY `FK_secretbox_button` (`secretbox_id`),
  CONSTRAINT `FK_secretbox_button` FOREIGN KEY (`secretbox_id`) REFERENCES `secretbox_list` (`secretbox_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `secretbox_cost` (
  `cost_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `button_id` int(10) unsigned NOT NULL,
  `unit_count` smallint(5) unsigned NOT NULL,
  `item_name` text NOT NULL,
  `unit_data_file` text NOT NULL,
  `amount` int(10) unsigned NOT NULL,
  PRIMARY KEY (`cost_id`),
  KEY `FK_secretbox_cost` (`button_id`),
  CONSTRAINT `FK_secretbox_cost` FOREIGN KEY (`button_id`) REFERENCES `secretbox_button` (`button_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `secretbox_list` (
  `secretbox_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `secretbox_type` tinyint(2) unsigned NOT NULL COMMENT 'All secretbox types described in file common/secretbox.ts',
  `member_category` tinyint(1) unsigned NOT NULL COMMENT '1 or 2',
  `name` text NOT NULL,
  `description` text NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'JP Timezone',
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'JP Timezone',
  `add_gauge` smallint(5) unsigned NOT NULL DEFAULT '0',
  `upper_limit` int(11) DEFAULT NULL,
  `animation_type` tinyint(2) unsigned NOT NULL DEFAULT '0',
  `menu_title_asset` text NOT NULL,
  `bg_asset` text NOT NULL,
  `navi_asset` text NOT NULL,
  `title_asset` text NOT NULL,
  `appeal_asset` text,
  `banner_asset_name` text,
  `banner_se_asset_name` text,
  `enabled` smallint(5) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`secretbox_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `secretbox_pon` (
  `user_id` int(10) unsigned NOT NULL,
  `secretbox_id` int(10) unsigned NOT NULL,
  `pon_count` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`secretbox_id`),
  KEY `FK_secretbox_pon_sb` (`secretbox_id`),
  CONSTRAINT `FK_secretbox_pon_sb` FOREIGN KEY (`secretbox_id`) REFERENCES `secretbox_list` (`secretbox_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_secretbox_pon_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `secretbox_step_up_settings` (
  `secretbox_id` int(10) unsigned NOT NULL,
  `reset_type` tinyint(3) unsigned NOT NULL COMMENT '0 -- no reset. 1 -- start from beggining',
  `start_step` int(10) unsigned NOT NULL DEFAULT '0',
  `end_step` int(10) unsigned NOT NULL,
  KEY `secretbox_step_up_settings` (`secretbox_id`),
  CONSTRAINT `secretbox_step_up_settings` FOREIGN KEY (`secretbox_id`) REFERENCES `secretbox_list` (`secretbox_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `user_class_live_progress` (
  `user_id` int(11) unsigned DEFAULT NULL,
  `live_setting_id_list` varchar(50) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `FK_user_class_live_progresss_user` (`user_id`),
  CONSTRAINT `FK_user_class_live_progresss_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE `error_log` ADD `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;
DROP TABLE `box_cost`;
DROP TABLE `box_list`;