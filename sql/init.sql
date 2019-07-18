-- --------------------------------------------------------
-- Хост:                         localhost
-- Версия сервера:               5.7.23-log - MySQL Community Server (GPL)
-- Операционная система:         Win32
-- HeidiSQL Версия:              10.1.0.5464
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Дамп структуры для таблица sunlight.auth_log
CREATE TABLE IF NOT EXISTS `auth_log` (
  `user_id` int(11) unsigned NOT NULL DEFAULT '0',
  `application_version` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_version` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_info` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.auth_tokens
CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `token` varchar(100) NOT NULL,
  `expire` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `session_key` varchar(50) NOT NULL,
  `login_key` varchar(128) NOT NULL,
  `login_passwd` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.banner_list
CREATE TABLE IF NOT EXISTS `banner_list` (
  `banner_type` smallint(3) unsigned NOT NULL,
  `target_id` smallint(4) unsigned NOT NULL,
  `asset_path` text NOT NULL,
  `asset_path_se` text NOT NULL,
  `member_category` tinyint(1) unsigned NOT NULL,
  `webview_url` text,
  `master_is_active_event` tinyint(1) DEFAULT NULL,
  `start_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.box_cost
CREATE TABLE IF NOT EXISTS `box_cost` (
  `box_id` int(3) unsigned NOT NULL,
  `cost_id` int(4) unsigned NOT NULL AUTO_INCREMENT,
  `type` text NOT NULL COMMENT '"loveca", "green_tickets", "bt_tickets"',
  `amount` int(11) NOT NULL,
  `unit_count` smallint(2) NOT NULL,
  `button_type` smallint(2) NOT NULL DEFAULT '1',
  `units` text NOT NULL COMMENT 'name of json file',
  PRIMARY KEY (`cost_id`),
  KEY `fk_box_id` (`box_id`),
  CONSTRAINT `fk_box_id` FOREIGN KEY (`box_id`) REFERENCES `box_list` (`box_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.box_list
CREATE TABLE IF NOT EXISTS `box_list` (
  `box_id` int(3) unsigned NOT NULL AUTO_INCREMENT,
  `member_category` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `box_type` smallint(2) unsigned NOT NULL DEFAULT '1',
  `box_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu_title` text NOT NULL,
  `box_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `background_asset` text NOT NULL,
  `navi_asset` text NOT NULL,
  `title_asset` text NOT NULL,
  `appeal_asset` text,
  `banner_asset_name` text,
  `banner_se_asset_name` text,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`box_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_params` (
	`user_id` INT(10) UNSIGNED NOT NULL,
	`param_name` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`value` INT(11) NOT NULL,
	PRIMARY KEY (`user_id`, `param_name`),
	INDEX `FK_user_params_user_id` (`user_id`),
	CONSTRAINT `FK_user_params_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `error_log` (
  `error_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `stacktrace` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`error_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_duty_live_progress` (
  `user_id` int(10) unsigned NOT NULL,
  `room_id` int(11) NOT NULL,
  `status` smallint(6) NOT NULL DEFAULT '0',
  `perfect_cnt` mediumint(5) NOT NULL DEFAULT '0',
  `great_cnt` mediumint(5) NOT NULL DEFAULT '0',
  `good_cnt` mediumint(5) NOT NULL DEFAULT '0',
  `bad_cnt` mediumint(5) NOT NULL DEFAULT '0',
  `miss_cnt` mediumint(5) NOT NULL DEFAULT '0',
  `love_cnt` mediumint(5) NOT NULL DEFAULT '0',
  `max_combo` mediumint(5) NOT NULL DEFAULT '0',
  `score_smile` int(11) NOT NULL DEFAULT '0',
  `score_pure` int(11) NOT NULL DEFAULT '0',
  `score_cool` int(11) NOT NULL DEFAULT '0',
  `mission_value` int(11) NOT NULL DEFAULT '0',
  `fc_flag` tinyint(1) NOT NULL DEFAULT '0',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`room_id`),
  KEY `FK_event_duty_lp_room_id` (`room_id`),
  KEY `FK_event_duty_lp_user_id` (`user_id`),
  CONSTRAINT `FK_event_duty_lp_room_id` FOREIGN KEY (`room_id`) REFERENCES `event_duty_rooms` (`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_event_duty_lp_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_duty_rooms` (
  `room_id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(5) unsigned NOT NULL,
  `entry_token` int(6) DEFAULT NULL,
  `difficulty` tinyint(1) NOT NULL,
  `live_difficulty_id` int(11) NOT NULL,
  `mission_id` tinyint(4) NOT NULL,
  `mission_goal` int(11) NOT NULL DEFAULT '0',
  `mission_result` int(11) DEFAULT NULL,
  `mission_rank` int(11) DEFAULT NULL,
  `bonus_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_flag` tinyint(4) NOT NULL DEFAULT '0',
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`),
  KEY `FK_duty_rooms_event_id` (`event_id`),
  CONSTRAINT `FK_duty_rooms_event_id` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_duty_users` (
  `user_id` int(10) unsigned NOT NULL,
  `room_id` int(11) NOT NULL,
  `chat_id` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deck_id` tinyint(2) DEFAULT NULL,
  `deck_mic` tinyint(2) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `insert_date_ms` bigint(20) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`,`user_id`),
  KEY `FK_event_duty_user_id` (`user_id`),
  KEY `FK_event_duty_room_id` (`room_id`),
  CONSTRAINT `FK_event_duty_room_id` FOREIGN KEY (`room_id`) REFERENCES `event_duty_rooms` (`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_event_duty_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.events_list
CREATE TABLE IF NOT EXISTS `events_list` (
  `event_id` int(5) unsigned NOT NULL,
  `name` text NOT NULL,
  `event_category_id` smallint(2) unsigned NOT NULL,
  `member_category` smallint(2) unsigned NOT NULL,
  `open_date` datetime NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `close_date` datetime NOT NULL,
  `description` text NOT NULL,
  `banner_asset_name` text NOT NULL,
  `banner_se_asset_name` text NOT NULL,
  `result_banner_asset_name` text NOT NULL,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.event_festival_live_progress
CREATE TABLE IF NOT EXISTS `event_festival_live_progress` (
  `event_id` int(5) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deck_id` smallint(3) NOT NULL,
  `continue_attempts` smallint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`event_id`,`user_id`),
  KEY `FK_festival_lp_user_id` (`user_id`),
  KEY `FK_festival_lp_event_id` (`event_id`),
  CONSTRAINT `FK_festival_lp_event_id` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_festival_lp_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.event_festival_users
CREATE TABLE IF NOT EXISTS `event_festival_users` (
  `event_id` int(5) unsigned NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `attribute` smallint(2) DEFAULT NULL,
  `count` int(11) NOT NULL,
  `difficulty_ids` text,
  `reset_setlist_number` int(11) DEFAULT NULL,
  `track_ids` text,
  `bonus_ids` varchar(50),
  PRIMARY KEY (`event_id`,`user_id`),
  KEY `FK_festival_event_id` (`event_id`),
  KEY `FK_festival_user_id` (`user_id`),
  CONSTRAINT `FK_festival_event_id` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_festival_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.event_ranking
CREATE TABLE IF NOT EXISTS `event_ranking` (
  `user_id` int(10) unsigned NOT NULL,
  `event_id` int(5) unsigned NOT NULL,
  `event_point` int(11) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `deck` text,
  `lives_played` MEDIUMINT(9) NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`event_id`),
  KEY `FK_event_ranking_user` (`user_id`),
  KEY `fk_event_ranking_event` (`event_id`),
  CONSTRAINT `FK_event_ranking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_ranking_event` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.login_bonus_sheets
CREATE TABLE IF NOT EXISTS `login_bonus_sheets` (
  `nlbonus_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `item_num` int(11) NOT NULL,
  `detail_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bg_asset` text NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`nlbonus_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.login_bonus_sheets_items
CREATE TABLE IF NOT EXISTS `login_bonus_sheets_items` (
  `nlbonus_id` int(11) unsigned NOT NULL,
  `nlbonus_item_id` int(11) NOT NULL AUTO_INCREMENT,
  `seq` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `item_type` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  PRIMARY KEY (`nlbonus_item_id`),
  KEY `login_bonus_sheets_items` (`nlbonus_id`),
  CONSTRAINT `login_bonus_sheets_items` FOREIGN KEY (`nlbonus_id`) REFERENCES `login_bonus_sheets` (`nlbonus_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.login_bonus_sheets_received
CREATE TABLE IF NOT EXISTS `login_bonus_sheets_received` (
  `user_id` int(10) unsigned NOT NULL,
  `nlbonus_item_id` int(11) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `login_bonus_sheets_rec_user_id` (`user_id`),
  KEY `login_bonus_sheets_rec_item` (`nlbonus_item_id`),
  CONSTRAINT `login_bonus_sheets_rec_item` FOREIGN KEY (`nlbonus_item_id`) REFERENCES `login_bonus_sheets_items` (`nlbonus_item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `login_bonus_sheets_rec_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.login_bonus_total
CREATE TABLE IF NOT EXISTS `login_bonus_total` (
  `user_id` int(11) unsigned NOT NULL,
  `days` smallint(6) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`days`),
  KEY `total_lbonus` (`user_id`),
  CONSTRAINT `total_lbonus` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.login_calendar_table
CREATE TABLE IF NOT EXISTS `login_calendar_table` (
  `year` mediumint(4) NOT NULL,
  `month` smallint(2) NOT NULL,
  `day_of_month` smallint(2) NOT NULL,
  `day_of_week` smallint(1) NOT NULL,
  `special_flag` tinyint(4) NOT NULL,
  `item_type` mediumint(9) NOT NULL,
  `item_id` mediumint(9) DEFAULT NULL,
  `amount` mediumint(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.login_received_list
CREATE TABLE IF NOT EXISTS `login_received_list` (
  `user_id` int(11) unsigned NOT NULL,
  `year` mediumint(4) NOT NULL,
  `month` smallint(2) NOT NULL,
  `day_of_month` smallint(2) NOT NULL,
  KEY `fk_login_received_user` (`user_id`),
  CONSTRAINT `fk_login_received_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.request_log
CREATE TABLE IF NOT EXISTS `request_log` (
  `user_id` int(11) DEFAULT NULL,
  `request` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` text COLLATE utf8mb4_unicode_ci,
  `action` text COLLATE utf8mb4_unicode_ci,
  `request_timestamp` timestamp NULL DEFAULT NULL,
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.reward_table
CREATE TABLE IF NOT EXISTS `reward_table` (
  `user_id` int(11) unsigned NOT NULL,
  `incentive_id` int(11) NOT NULL AUTO_INCREMENT,
  `incentive_item_id` int(11) DEFAULT NULL,
  `incentive_message` text CHARACTER SET utf8mb4 NOT NULL,
  `amount` int(11) NOT NULL,
  `item_type` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `attribute` smallint(1) DEFAULT NULL COMMENT 'only for cards',
  `rarity` smallint(1) DEFAULT NULL COMMENT 'only for cards',
  `is_support` smallint(1) NOT NULL DEFAULT '0',
  `insert_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `opened_date` datetime DEFAULT NULL,
  `item_option` text,
  `collected` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`incentive_id`),
  KEY `reward_user_id` (`user_id`),
  CONSTRAINT `reward_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.units
CREATE TABLE IF NOT EXISTS `units` (
  `user_id` int(10) unsigned NOT NULL,
  `unit_owning_user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `unit_id` smallint(5) unsigned NOT NULL DEFAULT '1',
  `exp` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `next_exp` mediumint(8) unsigned NOT NULL DEFAULT '6',
  `level` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `max_level` tinyint(3) unsigned NOT NULL DEFAULT '30',
  `unit_rank` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `max_rank` tinyint(1) unsigned NOT NULL DEFAULT '2',
  `love` smallint(4) unsigned NOT NULL DEFAULT '0',
  `max_love` smallint(4) unsigned NOT NULL DEFAULT '25',
  `unit_skill_level` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `unit_skill_exp` smallint(5) unsigned NOT NULL DEFAULT '0',
  `max_skill_level` tinyint(4) unsigned NOT NULL DEFAULT '8',
  `max_hp` tinyint(2) unsigned NOT NULL DEFAULT '2',
  `removable_skill_capacity` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `max_removable_skill_capacity` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `favorite_flag` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `display_rank` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `deleted` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `stat_smile` smallint(5) unsigned NOT NULL DEFAULT '0',
  `stat_pure` smallint(5) unsigned NOT NULL DEFAULT '0',
  `stat_cool` smallint(5) unsigned NOT NULL DEFAULT '0',
  `attribute` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `insert_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`unit_owning_user_id`),
  KEY `fk_unit_owner` (`user_id`),
  CONSTRAINT `fk_unit_owner` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No Name',
  `level` smallint(5) unsigned NOT NULL DEFAULT '2',
  `exp` mediumint(7) unsigned NOT NULL DEFAULT '0',
  `next_exp` mediumint(7) NOT NULL DEFAULT '23',
  `previous_exp` mediumint(7) unsigned NOT NULL DEFAULT '0',
  `game_coin` int(10) unsigned NOT NULL DEFAULT '100000',
  `sns_coin` int(10) unsigned NOT NULL DEFAULT '1000',
  `free_sns_coin` int(10) unsigned NOT NULL DEFAULT '0',
  `paid_sns_coin` int(10) unsigned DEFAULT '0',
  `social_point` int(10) unsigned NOT NULL DEFAULT '0',
  `unit_max` smallint(6) unsigned NOT NULL DEFAULT '9999',
  `energy_max` smallint(5) unsigned NOT NULL DEFAULT '100',
  `energy_full_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `over_max_energy` smallint(5) unsigned NOT NULL DEFAULT '0',
  `friend_max` smallint(5) unsigned NOT NULL DEFAULT '100',
  `unlock_random_live_muse` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `unlock_random_live_aqours` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `insert_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT CURRENT_TIMESTAMP,
  `tutorial_state` tinyint(1) NOT NULL DEFAULT '0',
  `next_free_muse_gacha` bigint(20) unsigned NOT NULL DEFAULT '0',
  `next_free_aqours_gacha` bigint(20) unsigned DEFAULT '0',
  `setting_award_id` int(4) unsigned NOT NULL DEFAULT '1',
  `setting_background_id` int(4) unsigned NOT NULL DEFAULT '1',
  `introduction` text COLLATE utf8mb4_unicode_ci,
  `main_deck` tinyint(1) unsigned DEFAULT '1',
  `partner_unit` int(10) unsigned DEFAULT NULL,
  `password` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `box_gauge` mediumint(9) NOT NULL DEFAULT '0',
  `bt_tickets` int(10) NOT NULL DEFAULT '5',
  `green_tickets` int(10) NOT NULL DEFAULT '5',
  `birth_day` tinyint(2) unsigned DEFAULT NULL,
  `birth_month` tinyint(2) unsigned DEFAULT NULL,
  `language` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ru',
  PRIMARY KEY (`user_id`),
  KEY `user_partner` (`partner_unit`),
  CONSTRAINT `user_partner` FOREIGN KEY (`partner_unit`) REFERENCES `units` (`unit_owning_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_award_unlock
CREATE TABLE IF NOT EXISTS `user_award_unlock` (
  `user_id` int(10) unsigned NOT NULL,
  `award_id` int(5) unsigned NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`award_id`),
  CONSTRAINT `FK_award_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_background_unlock
CREATE TABLE IF NOT EXISTS `user_background_unlock` (
  `user_id` int(10) unsigned NOT NULL,
  `background_id` int(5) unsigned NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`background_id`),
  CONSTRAINT `FK_background_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_banned
CREATE TABLE IF NOT EXISTS `user_banned` (
  `user_id` int(11) unsigned NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  KEY `user_banned` (`user_id`),
  CONSTRAINT `user_banned` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_exchange_point
CREATE TABLE IF NOT EXISTS `user_exchange_point` (
  `user_id` int(10) unsigned NOT NULL,
  `rarity` tinyint(1) unsigned NOT NULL,
  `exchange_point` smallint(5) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`rarity`),
  CONSTRAINT `fk_exchange_point_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_greet
CREATE TABLE IF NOT EXISTS `user_greet` (
  `notice_id` int(11) NOT NULL AUTO_INCREMENT,
  `affector_id` int(11) unsigned NOT NULL,
  `receiver_id` int(11) unsigned NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `readed` tinyint(4) NOT NULL DEFAULT '0',
  `reply` tinyint(4) NOT NULL DEFAULT '0',
  `insert_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_from_affector` tinyint(4) NOT NULL DEFAULT '0',
  `deleted_from_receiver` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`notice_id`),
  KEY `FK_usergreeting_affector` (`affector_id`),
  KEY `FK_usergreeting_recipient` (`receiver_id`),
  CONSTRAINT `FK_usergreeting_affector` FOREIGN KEY (`affector_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_usergreeting_recipient` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_live_goal_rewards
CREATE TABLE IF NOT EXISTS `user_live_goal_rewards` (
  `user_id` int(10) unsigned NOT NULL,
  `live_goal_reward_id` int(10) unsigned NOT NULL,
  `live_difficulty_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`live_goal_reward_id`),
  CONSTRAINT `FK_user_live_goal_rewards` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_live_progress
CREATE TABLE IF NOT EXISTS `user_live_progress` (
  `user_id` int(10) unsigned NOT NULL,
  `live_difficulty_id` int(10) unsigned NOT NULL,
  `live_setting_id` int(10) NOT NULL,
  `deck_id` tinyint(1) unsigned NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `continue_attempts` smallint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`live_difficulty_id`),
  KEY `FK_live_progress` (`user_id`,`deck_id`),
  CONSTRAINT `FK_live_progress` FOREIGN KEY (`user_id`, `deck_id`) REFERENCES `user_unit_deck` (`user_id`, `unit_deck_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_live_status
CREATE TABLE IF NOT EXISTS `user_live_status` (
  `user_id` int(10) unsigned NOT NULL,
  `live_difficulty_id` int(10) unsigned NOT NULL,
  `live_setting_id` int(11) unsigned NOT NULL,
  `status` int(4) unsigned NOT NULL DEFAULT '0',
  `hi_score` int(10) unsigned NOT NULL DEFAULT '0',
  `hi_combo` int(10) unsigned NOT NULL DEFAULT '0',
  `clear_cnt` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`live_difficulty_id`,`live_setting_id`),
  CONSTRAINT `FK_user_live_status` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_login
CREATE TABLE IF NOT EXISTS `user_login` (
  `user_id` int(10) unsigned NOT NULL,
  `login_key` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_passwd` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_token` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_admin_access` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UNIQUE_login_key` (`login_key`),
  KEY `FK_user_login` (`user_id`),
  CONSTRAINT `FK_user_login` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_personal_notice
CREATE TABLE IF NOT EXISTS `user_personal_notice` (
  `user_id` int(10) unsigned NOT NULL,
  `notice_id` int(11) NOT NULL AUTO_INCREMENT,
  `notice_type` smallint(6) NOT NULL,
  `title` text CHARACTER SET utf8mb4,
  `contents` text CHARACTER SET utf8mb4,
  `agreed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`notice_id`),
  KEY `FK_user_personal_notice` (`user_id`),
  KEY `notice_id` (`notice_id`),
  CONSTRAINT `FK_user_personal_notice` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_stamp_deck
CREATE TABLE IF NOT EXISTS `user_stamp_deck` (
  `user_id` int(10) unsigned NOT NULL,
  `stamp_type` tinyint(1) unsigned NOT NULL,
  `stamp_setting_id` tinyint(1) unsigned NOT NULL,
  `main_flag` tinyint(1) NOT NULL,
  PRIMARY KEY (`user_id`,`stamp_type`,`stamp_setting_id`,`main_flag`),
  CONSTRAINT `FK_user_stamp_deck` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_stamp_deck_slot
CREATE TABLE IF NOT EXISTS `user_stamp_deck_slot` (
  `user_id` int(10) unsigned NOT NULL,
  `stamp_type` tinyint(1) unsigned NOT NULL,
  `stamp_setting_id` tinyint(1) unsigned NOT NULL,
  `position` tinyint(1) unsigned NOT NULL,
  `stamp_id` smallint(5) unsigned DEFAULT NULL,
  PRIMARY KEY (`user_id`,`stamp_type`,`stamp_setting_id`,`position`),
  CONSTRAINT `FK_stamp_slot` FOREIGN KEY (`user_id`, `stamp_type`, `stamp_setting_id`) REFERENCES `user_stamp_deck` (`user_id`, `stamp_type`, `stamp_setting_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_support_unit
CREATE TABLE IF NOT EXISTS `user_support_unit` (
  `user_id` int(10) unsigned NOT NULL,
  `unit_id` smallint(5) unsigned NOT NULL,
  `amount` smallint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`,`unit_id`),
  CONSTRAINT `fk_support_unit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_unit_album
CREATE TABLE IF NOT EXISTS `user_unit_album` (
  `user_id` int(10) unsigned NOT NULL,
  `unit_id` int(10) unsigned NOT NULL,
  `rank_max_flag` tinyint(1) NOT NULL DEFAULT '0',
  `love_max_flag` tinyint(1) NOT NULL DEFAULT '0',
  `rank_level_max_flag` tinyint(1) NOT NULL DEFAULT '0',
  `all_max_flag` tinyint(1) NOT NULL DEFAULT '0',
  `highest_love_per_unit` smallint(5) unsigned NOT NULL DEFAULT '0',
  `total_love` int(10) unsigned NOT NULL DEFAULT '0',
  `favorite_point` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`unit_id`),
  CONSTRAINT `fk_album_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_unit_deck
CREATE TABLE IF NOT EXISTS `user_unit_deck` (
  `user_id` int(10) unsigned NOT NULL,
  `unit_deck_id` tinyint(2) unsigned NOT NULL,
  `deck_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No Name',
  PRIMARY KEY (`user_id`,`unit_deck_id`),
  CONSTRAINT `fk_deck_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_unit_deck_slot
CREATE TABLE IF NOT EXISTS `user_unit_deck_slot` (
  `user_id` int(10) unsigned NOT NULL,
  `deck_id` tinyint(2) unsigned NOT NULL,
  `slot_id` tinyint(1) unsigned NOT NULL,
  `unit_owning_user_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`deck_id`,`slot_id`),
  UNIQUE KEY `unit_unique_per_deck` (`unit_owning_user_id`,`deck_id`),
  CONSTRAINT `fk_slot_deck` FOREIGN KEY (`user_id`, `deck_id`) REFERENCES `user_unit_deck` (`user_id`, `unit_deck_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_slot_unit` FOREIGN KEY (`unit_owning_user_id`) REFERENCES `units` (`unit_owning_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_unit_removable_skill_equip
CREATE TABLE IF NOT EXISTS `user_unit_removable_skill_equip` (
  `unit_owning_user_id` int(10) unsigned NOT NULL,
  `unit_removable_skill_id` tinyint(2) unsigned NOT NULL,
  PRIMARY KEY (`unit_owning_user_id`,`unit_removable_skill_id`),
  CONSTRAINT `fk_removable_skill_equip_unit` FOREIGN KEY (`unit_owning_user_id`) REFERENCES `units` (`unit_owning_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для таблица sunlight.user_unit_removable_skill_owning
CREATE TABLE IF NOT EXISTS `user_unit_removable_skill_owning` (
  `user_id` int(10) unsigned NOT NULL,
  `unit_removable_skill_id` tinyint(2) unsigned NOT NULL,
  `total_amount` smallint(4) unsigned DEFAULT '0',
  `insert_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`unit_removable_skill_id`),
  CONSTRAINT `fk_removable_skill_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для представление sunlight.v_units_not_locked
-- Создание временной таблицы для обработки ошибок зависимостей представлений
CREATE TABLE `v_units_not_locked` (
	`unit_owning_user_id` INT(10) UNSIGNED NOT NULL,
	`user_id` INT(10) UNSIGNED NOT NULL,
	`level` TINYINT(3) UNSIGNED NOT NULL,
	`unit_id` SMALLINT(5) UNSIGNED NOT NULL,
	`unit_skill_level` TINYINT(1) UNSIGNED NOT NULL
) ENGINE=MyISAM;

-- Дамп структуры для таблица sunlight.webview_announce
CREATE TABLE IF NOT EXISTS `webview_announce` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text CHARACTER SET utf8mb4 NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text CHARACTER SET utf8mb4 NOT NULL,
  `announce` text CHARACTER SET utf8mb4,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_friend` (
	`initiator_id` INT(10) UNSIGNED NOT NULL,
	`recipient_id` INT(10) UNSIGNED NOT NULL,
	`readed` TINYINT(1) NOT NULL DEFAULT '0',
	`status` TINYINT(1) NOT NULL DEFAULT '0',
	`agree_date` TIMESTAMP NULL DEFAULT NULL,
	`insert_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`initiator_id`, `recipient_id`),
	INDEX `FK_user_friend_recipient_id` (`recipient_id`),
	CONSTRAINT `FK_user_friend_initiator_id` FOREIGN KEY (`initiator_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `FK_user_friend_recipient_id` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_notice` (
	`notice_id` INT(11) NOT NULL AUTO_INCREMENT,
	`affector_id` INT(10) UNSIGNED NOT NULL,
	`receiver_id` INT(10) NULL DEFAULT NULL,
	`filter_id` SMALLINT(6) NOT NULL DEFAULT '0',
	`readed` TINYINT(4) NOT NULL DEFAULT '0',
	`message` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',
	`insert_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`notice_id`),
	INDEX `FK_user_notice_affector` (`affector_id`),
	CONSTRAINT `FK_user_notice_affector` FOREIGN KEY (`affector_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Экспортируемые данные не выделены.
-- Дамп структуры для представление sunlight.v_units_not_locked
-- Удаление временной таблицы и создание окончательной структуры представления
DROP TABLE IF EXISTS `v_units_not_locked`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_units_not_locked` AS select `units`.`unit_owning_user_id` AS `unit_owning_user_id`,`units`.`user_id` AS `user_id`,`units`.`level` AS `level`,`units`.`unit_id` AS `unit_id`,`units`.`unit_skill_level` AS `unit_skill_level` from `units` where ((not(`units`.`unit_owning_user_id` in (select `s`.`unit_owning_user_id` from (`user_unit_deck_slot` `s` join `users` `u` on(((`u`.`user_id` = `s`.`user_id`) and (`u`.`main_deck` = `s`.`deck_id`)))) where (`u`.`user_id` = `units`.`user_id`)))) and (not(`units`.`unit_owning_user_id` in (select `users`.`partner_unit` from `users` where (`users`.`user_id` = `units`.`user_id`)))) and (`units`.`favorite_flag` = 0) and (`units`.`deleted` = 0));

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;