-- Tables creation
-- WIP

/* Brain table */
CREATE TABLE `user` (
	`user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT "No name",
	`introduction` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT "Hello!",
  `partner_unit` INT UNSIGNED NOT NULL,
	`login_key` VARCHAR(36) NULL, -- TODO: hashing
	`login_passwd` VARCHAR(128) NULL,
	`email` VARCHAR(100) NULL,
	`password` VARCHAR(100) NOT NULL,
  `auth_token` VARCHAR(100) NULL,
  `session_key` VARCHAR(100) NULL,
	`lang` TINYINT UNSIGNED NOT NULL DEFAULT 0,
	`birth_date` VARCHAR(5) NULL COMMENT 'DD.MM',
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
	`update_date` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_activity_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(), -- update on request
  PRIMARY KEY (`user_id`),
  KEY (`login_key`, `login_passwd`, `email`, `password`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* There will be every attempt to log in */
CREATE TABLE `auth_log` (
  `user_id` BIGINT NOT NULL DEFAULT -1 COMMENT 'Not same as user_id in user table',
  `app_version` VARCHAR(10) NOT NULL,
  `client_version` VARCHAR(10) NOT NULL,
  `ip` VARCHAR(15) NOT NULL,
  /* `platform` VARCHAR NOT NULL, */
  `device_info` TEXT NOT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  KEY (`user_id`, `ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Unlocked awards (not used yet) */
CREATE TABLE `award` (
  `user_id` INT UNSIGNED NOT NULL,
  `award_id` INT UNSIGNED NOT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY (`award_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Unlocked backgrounds (not used yet) */
CREATE TABLE `background` (
  `user_id` INT UNSIGNED NOT NULL,
  `background_id` INT UNSIGNED NOT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY (`background_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Owned removable skills by user */
CREATE TABLE `removable_skill` (
  `user_id` INT UNSIGNED NOT NULL,
  `unit_removable_skill_id` INT UNSIGNED NOT NULL,
  `skill_type` TINYINT UNSIGNED NOT NULL, /* 1/2 */
  `amount` INT UNSIGNED NOT NULL,
  `equipped` INT UNSIGNED NOT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`, `unit_removable_skill_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Equipment removable skills to units */
CREATE TABLE `removable_skill_equipment` (
  `user_id` INT UNSIGNED NOT NULL,
  `unit_removable_skill_id` INT UNSIGNED NOT NULL,
  `unit_id` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY (`unit_removable_skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* a.k.a. items in reward box */
CREATE TABLE `incentive` (
  `incentive_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `incentive_item_id` INT UNSIGNED NULL,
  `item_type` INT UNSIGNED NOT NULL,
  `item_id` INT UNSIGNED NOT NULL,
  `amount` INT UNSIGNED NOT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `opened_date` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`incentive_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Banned users */
CREATE TABLE `user_ban` (
  `user_id` INT UNSIGNED NOT NULL,
  `message` TEXT NULL,
  `expiration_date` TIMESTAMP NULL DEFAULT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Relationships between users */
CREATE TABLE `friend` (
  `initiator_id` INT UNSIGNED NOT NULL,
  `recipient_id` INT UNSIGNED NOT NULL,
  `readed` TINYINT(1) NOT NULL DEFAULT 0,
  `status` TINYINT(1) NOT NULL DEFAULT 0,
  `agree_date` TIMESTAMP NULL DEFAULT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`initiator_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`recipient_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Messages between users in-game */
CREATE TABLE `message` (
  `notice_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `affector_id` INT UNSIGNED NOT NULL,
  `receiver_id` INT UNSIGNED NOT NULL,
  `message` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `readed` TINYINT(1) NOT NULL DEFAULT 0,
  `replied` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_from_affector` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_from_receiver` TINYINT(1) NOT NULL DEFAULT 0,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notice_id`),
  FOREIGN KEY (`affector_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `unit_deck` (
  `user_id` INT UNSIGNED NOT NULL,
  `unit_deck_id` TINYINT(2) UNSIGNED NOT NULL,
  `deck_name` VARCHAR(10) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `unit_deck_slot` (
  `unit_deck_id` TINYINT(2) UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `slot_id` TINYINT(2) NOT NULL,
  `unit_owning_user_id` VARCHAR(10) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY (`unit_deck_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `stamp_deck` (
  `user_id` INT UNSIGNED NOT NULL,
  `stamp_type` TINYINT(1) UNSIGNED NOT NULL,
  `stamp_setting_id` TINYINT(1) UNSIGNED NOT NULL,
  `main_flag` TINYINT(1) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `stamp_deck_slot` (
  `user_id` INT UNSIGNED NOT NULL,
  `stamp_type` TINYINT(1) UNSIGNED NOT NULL,
  `stamp_setting_id` TINYINT(1) UNSIGNED NOT NULL,
  `position` TINYINT(1) UNSIGNED NOT NULL,
  `stamp_id` SMALLINT(5) UNSIGNED DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `random_live` (
  `user_id` INT UNSIGNED NOT NULL,
  `attribute` TINYINT(1) UNSIGNED NOT NULL,
  `difficulty` TINYINT(1) UNSIGNED NOT NULL,
  `member_category` TINYINT(1) UNSIGNED NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `live_difficulty_id` MEDIUMINT(9) UNSIGNED NOT NULL,
  `in_progress` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `live_goal` (
  `user_id` INT UNSIGNED NOT NULL,
  `live_goal_reward_id` INT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY (`live_goal_reward_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `support_unit` (
  `user_id` INT UNSIGNED NOT NULL,
  `unit_id` SMALLINT(5) UNSIGNED NOT NULL,
  `amount` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `webview_news` (
  `announce_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL,
  `description` TEXT NOT NULL,
  `markdown_body` TEXT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `update_date` TIMESTAMP NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`announce_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


/* TODO
-- banners on the home page
CREATE TABLE `banner` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- events
CREATE TABLE `event` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- event ranking
CREATE TABLE `event_rank` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- calendar with items
CREATE TABLE `login_bonus` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- received items
CREATE TABLE `login_bonus_log` (
  `user_id` INT UNSIGNED NOT NULL,
  `insert_date` TIMESTAMP NOT NULL DEFAULT current_timestamp() -- ?
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_bonus_total` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_bonus_total_received` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- special list
CREATE TABLE `login_bonus_special` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_bonus_special_item` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_bonus_special_item_received` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `login_bonus_birthday` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `personal_notice` (
  `notice_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type_id` SMALLINT UNSIGNED NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `contents` TEXT NOT NULL,
  `agreed` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`notice_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tos` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tos_log` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `unit` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `unit_album` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `exchange` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `exchange_cost` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `exchange_log` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `live_log` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `live_progress` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `live_status` (

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

*/