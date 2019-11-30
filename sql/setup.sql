CREATE TABLE `auth_log` (
  `user_id` int(11) UNSIGNED NOT NULL DEFAULT 0,
  `application_version` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_version` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_info` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_recovery_codes` (
  `token` varchar(100) NOT NULL DEFAULT '',
  `code` varchar(10) NOT NULL DEFAULT '',
  `mail` varchar(100) NOT NULL DEFAULT '',
  `expire` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `auth_tokens` (
  `token` varchar(100) NOT NULL,
  `expire` timestamp NOT NULL DEFAULT current_timestamp(),
  `session_key` varchar(50) NOT NULL,
  `login_key` varchar(128) NOT NULL,
  `login_passwd` varchar(128) NOT NULL,
  `language` varchar(50) NOT NULL DEFAULT 'ru'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `banner_list` (
  `banner_type` smallint(3) UNSIGNED NOT NULL,
  `target_id` smallint(4) UNSIGNED NOT NULL,
  `asset_path` text NOT NULL,
  `asset_path_se` text NOT NULL,
  `member_category` tinyint(1) UNSIGNED NOT NULL,
  `webview_url` text DEFAULT NULL,
  `master_is_active_event` tinyint(1) DEFAULT NULL,
  `start_date` datetime DEFAULT current_timestamp(),
  `end_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `error_log` (
  `error_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `stacktrace` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `events_list` (
  `event_id` int(5) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `event_category_id` smallint(2) UNSIGNED NOT NULL,
  `member_category` smallint(2) UNSIGNED NOT NULL,
  `open_date` datetime NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `close_date` datetime NOT NULL,
  `description` text NOT NULL,
  `banner_asset_name` text NOT NULL,
  `banner_se_asset_name` text NOT NULL,
  `result_banner_asset_name` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `event_duty_live_progress` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `room_id` int(11) NOT NULL,
  `status` smallint(6) NOT NULL DEFAULT 0,
  `perfect_cnt` mediumint(5) NOT NULL DEFAULT 0,
  `great_cnt` mediumint(5) NOT NULL DEFAULT 0,
  `good_cnt` mediumint(5) NOT NULL DEFAULT 0,
  `bad_cnt` mediumint(5) NOT NULL DEFAULT 0,
  `miss_cnt` mediumint(5) NOT NULL DEFAULT 0,
  `love_cnt` mediumint(5) NOT NULL DEFAULT 0,
  `max_combo` mediumint(5) NOT NULL DEFAULT 0,
  `score_smile` int(11) NOT NULL DEFAULT 0,
  `score_pure` int(11) NOT NULL DEFAULT 0,
  `score_cool` int(11) NOT NULL DEFAULT 0,
  `mission_value` int(11) NOT NULL DEFAULT 0,
  `fc_flag` tinyint(1) NOT NULL DEFAULT 0,
  `update_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_duty_rooms` (
  `room_id` int(11) NOT NULL,
  `event_id` int(5) UNSIGNED NOT NULL,
  `entry_token` int(6) DEFAULT NULL,
  `difficulty` tinyint(1) NOT NULL,
  `live_difficulty_id` int(11) NOT NULL,
  `mission_id` tinyint(4) NOT NULL,
  `mission_goal` int(11) NOT NULL DEFAULT 0,
  `mission_result` int(11) DEFAULT NULL,
  `mission_rank` int(11) DEFAULT NULL,
  `bonus_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_flag` tinyint(4) NOT NULL DEFAULT 0,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_duty_users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `room_id` int(11) NOT NULL,
  `chat_id` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deck_id` tinyint(2) DEFAULT NULL,
  `deck_mic` tinyint(2) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `insert_date_ms` bigint(20) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_festival_live_progress` (
  `event_id` int(5) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT current_timestamp(),
  `deck_id` smallint(3) NOT NULL,
  `continue_attempts` smallint(3) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `event_festival_users` (
  `event_id` int(5) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `attribute` smallint(2) DEFAULT NULL,
  `count` int(11) NOT NULL,
  `difficulty_ids` text DEFAULT NULL,
  `reset_setlist_number` int(11) DEFAULT NULL,
  `track_ids` text DEFAULT NULL,
  `bonus_ids` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `event_ranking` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `event_id` int(5) UNSIGNED NOT NULL,
  `event_point` int(11) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `lives_played` mediumint(9) DEFAULT 0,
  `deck` text DEFAULT NULL,
  `token_point` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `exchange_cost` (
  `exchange_item_id` int(10) UNSIGNED NOT NULL,
  `rarity` int(10) UNSIGNED NOT NULL,
  `cost_value` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exchange_item` (
  `exchange_item_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `amount` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `item_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `item_id` int(11) UNSIGNED DEFAULT NULL,
  `max_count` int(10) UNSIGNED DEFAULT NULL,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exchange_log` (
  `exchange_item_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `got_item_count` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_bonus_sheets` (
  `nlbonus_id` int(11) UNSIGNED NOT NULL,
  `item_num` int(11) NOT NULL,
  `detail_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bg_asset` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `end_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_bonus_sheets_items` (
  `nlbonus_id` int(11) UNSIGNED NOT NULL,
  `nlbonus_item_id` int(11) NOT NULL,
  `seq` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `item_type` int(11) NOT NULL,
  `amount` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_bonus_sheets_received` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `nlbonus_item_id` int(11) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_bonus_total` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `days` smallint(6) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `login_calendar_table` (
  `year` mediumint(4) NOT NULL,
  `month` smallint(2) NOT NULL,
  `day_of_month` smallint(2) NOT NULL,
  `day_of_week` smallint(1) NOT NULL,
  `special_flag` tinyint(4) NOT NULL,
  `item_type` mediumint(9) NOT NULL,
  `item_id` mediumint(9) DEFAULT NULL,
  `amount` mediumint(9) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `login_received_list` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `year` mediumint(4) NOT NULL,
  `month` smallint(2) NOT NULL,
  `day_of_month` smallint(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `request_log` (
  `user_id` int(11) DEFAULT NULL,
  `request` longtext COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''
) ;

CREATE TABLE `reward_table` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `incentive_id` int(11) NOT NULL,
  `incentive_item_id` int(11) DEFAULT NULL,
  `incentive_message` text NOT NULL,
  `amount` int(11) NOT NULL,
  `item_type` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `insert_date` datetime NOT NULL DEFAULT current_timestamp(),
  `opened_date` datetime DEFAULT NULL,
  `item_option` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `secretbox_button` (
  `button_id` int(10) UNSIGNED NOT NULL,
  `secretbox_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `step_id` int(10) UNSIGNED DEFAULT NULL,
  `type` smallint(5) UNSIGNED NOT NULL COMMENT 'All button types described in types/secretbox.ts',
  `balloon_asset` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `secretbox_cost` (
  `cost_id` int(10) UNSIGNED NOT NULL,
  `button_id` int(10) UNSIGNED NOT NULL,
  `unit_count` smallint(5) UNSIGNED NOT NULL,
  `item_name` text NOT NULL,
  `unit_data_file` text NOT NULL,
  `amount` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `secretbox_list` (
  `secretbox_id` int(10) UNSIGNED NOT NULL,
  `secretbox_type` tinyint(2) UNSIGNED NOT NULL COMMENT 'All secretbox types described in file types/secretbox.ts',
  `member_category` tinyint(1) UNSIGNED NOT NULL COMMENT '1 or 2',
  `name` text NOT NULL,
  `description` text NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'JP Timezone',
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'JP Timezone',
  `add_gauge` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `upper_limit` int(11) NOT NULL DEFAULT 0,
  `animation_type` tinyint(2) UNSIGNED NOT NULL DEFAULT 0,
  `menu_title_asset` text NOT NULL,
  `bg_asset` text NOT NULL,
  `navi_asset` text NOT NULL,
  `title_asset` text NOT NULL,
  `appeal_asset` text DEFAULT NULL,
  `banner_asset_name` text DEFAULT NULL,
  `banner_se_asset_name` text DEFAULT NULL,
  `always_visible` tinyint(1) UNSIGNED DEFAULT 0,
  `enabled` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `secretbox_pon` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `secretbox_id` int(10) UNSIGNED NOT NULL,
  `pon_count` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `secretbox_step_up_settings` (
  `secretbox_id` int(10) UNSIGNED NOT NULL,
  `reset_type` tinyint(3) UNSIGNED NOT NULL COMMENT '0 -- no reset. 1 -- start from beggining',
  `start_step` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `end_step` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `units` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `unit_owning_user_id` int(10) UNSIGNED NOT NULL,
  `unit_id` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `exp` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `next_exp` mediumint(8) UNSIGNED NOT NULL DEFAULT 6,
  `level` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `max_level` tinyint(3) UNSIGNED NOT NULL DEFAULT 30,
  `rank` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `max_rank` tinyint(1) UNSIGNED NOT NULL DEFAULT 2,
  `love` smallint(4) UNSIGNED NOT NULL DEFAULT 0,
  `max_love` smallint(4) UNSIGNED NOT NULL DEFAULT 25,
  `unit_skill_level` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `unit_skill_exp` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `max_skill_level` tinyint(4) UNSIGNED NOT NULL DEFAULT 8,
  `max_hp` tinyint(2) UNSIGNED NOT NULL DEFAULT 2,
  `removable_skill_capacity` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `max_removable_skill_capacity` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `favorite_flag` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `display_rank` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `deleted` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `stat_smile` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `stat_pure` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `stat_cool` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `attribute` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `insert_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No Name',
  `level` smallint(5) UNSIGNED NOT NULL DEFAULT 2,
  `exp` mediumint(7) UNSIGNED NOT NULL DEFAULT 0,
  `next_exp` mediumint(7) NOT NULL DEFAULT 23,
  `previous_exp` mediumint(7) UNSIGNED NOT NULL DEFAULT 0,
  `game_coin` int(10) UNSIGNED NOT NULL DEFAULT 100000,
  `sns_coin` int(10) UNSIGNED NOT NULL DEFAULT 1000,
  `free_sns_coin` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `paid_sns_coin` int(10) UNSIGNED DEFAULT 0,
  `social_point` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `unit_max` smallint(6) UNSIGNED NOT NULL DEFAULT 9999,
  `energy_max` smallint(5) UNSIGNED NOT NULL DEFAULT 100,
  `energy_full_time` datetime NOT NULL DEFAULT current_timestamp(),
  `over_max_energy` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `friend_max` smallint(5) UNSIGNED NOT NULL DEFAULT 100,
  `unlock_random_live_muse` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `unlock_random_live_aqours` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `insert_date` datetime DEFAULT current_timestamp(),
  `update_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` datetime DEFAULT current_timestamp(),
  `tutorial_state` tinyint(1) NOT NULL DEFAULT 0,
  `next_free_muse_gacha` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `next_free_aqours_gacha` bigint(20) UNSIGNED DEFAULT 0,
  `setting_award_id` int(4) UNSIGNED NOT NULL DEFAULT 1,
  `setting_background_id` int(4) UNSIGNED NOT NULL DEFAULT 1,
  `introduction` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `main_deck` tinyint(1) UNSIGNED DEFAULT 1,
  `partner_unit` int(10) UNSIGNED DEFAULT NULL,
  `password` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `box_gauge` mediumint(9) NOT NULL DEFAULT 0,
  `bt_tickets` int(10) NOT NULL DEFAULT 5,
  `green_tickets` int(10) NOT NULL DEFAULT 5,
  `birth_day` tinyint(2) UNSIGNED DEFAULT NULL,
  `birth_month` tinyint(2) UNSIGNED DEFAULT NULL,
  `language` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ru',
  `mail` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_award_unlock` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `award_id` int(5) UNSIGNED NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_background_unlock` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `background_id` int(5) UNSIGNED NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_banned` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `expiration_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_class_live_progress` (
  `user_id` int(11) UNSIGNED DEFAULT NULL,
  `live_setting_id_list` varchar(50) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_exchange_point` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `rarity` tinyint(1) UNSIGNED NOT NULL,
  `exchange_point` smallint(5) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_friend` (
  `initiator_id` int(10) UNSIGNED NOT NULL,
  `recipient_id` int(10) UNSIGNED NOT NULL,
  `readed` tinyint(1) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 0,
  `agree_date` timestamp NULL DEFAULT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_greet` (
  `notice_id` int(11) NOT NULL,
  `affector_id` int(11) UNSIGNED NOT NULL,
  `receiver_id` int(11) UNSIGNED NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `readed` tinyint(4) NOT NULL DEFAULT 0,
  `reply` tinyint(4) NOT NULL DEFAULT 0,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_from_affector` tinyint(4) NOT NULL DEFAULT 0,
  `deleted_from_receiver` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_live_goal_rewards` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `live_goal_reward_id` int(10) UNSIGNED NOT NULL,
  `live_difficulty_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_live_log` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `live_setting_id` int(11) DEFAULT NULL,
  `live_setting_ids` varchar(50) DEFAULT NULL,
  `mods` varchar(50) NOT NULL DEFAULT '',
  `is_event` tinyint(4) NOT NULL DEFAULT 0,
  `score` int(11) NOT NULL,
  `combo` int(11) NOT NULL,
  `combo_rank` int(11) NOT NULL,
  `score_rank` int(11) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user_live_progress` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `live_difficulty_id` int(10) UNSIGNED NOT NULL,
  `live_setting_id` int(10) NOT NULL,
  `deck_id` tinyint(1) UNSIGNED NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `continue_attempts` smallint(3) NOT NULL DEFAULT 0,
  `lp_factor` smallint(6) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_live_status` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `live_difficulty_id` int(10) UNSIGNED NOT NULL,
  `live_setting_id` int(11) UNSIGNED NOT NULL,
  `status` int(4) UNSIGNED NOT NULL DEFAULT 0,
  `hi_score` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `hi_combo` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `clear_cnt` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_login` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `login_key` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_passwd` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_token` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_admin_access` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_notice` (
  `notice_id` int(11) NOT NULL,
  `affector_id` int(10) UNSIGNED NOT NULL,
  `receiver_id` int(10) DEFAULT NULL,
  `filter_id` smallint(6) NOT NULL DEFAULT 0,
  `readed` tinyint(4) NOT NULL DEFAULT 0,
  `message` text CHARACTER SET utf8mb4 DEFAULT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `type_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_params` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `param_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_personal_notice` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `notice_id` int(11) NOT NULL,
  `notice_type` smallint(6) NOT NULL,
  `title` text DEFAULT NULL,
  `contents` text DEFAULT NULL,
  `agreed` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_stamp_deck` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `stamp_type` tinyint(1) UNSIGNED NOT NULL,
  `stamp_setting_id` tinyint(1) UNSIGNED NOT NULL,
  `main_flag` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_stamp_deck_slot` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `stamp_type` tinyint(1) UNSIGNED NOT NULL,
  `stamp_setting_id` tinyint(1) UNSIGNED NOT NULL,
  `position` tinyint(1) UNSIGNED NOT NULL,
  `stamp_id` smallint(5) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_support_unit` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `unit_id` smallint(5) UNSIGNED NOT NULL,
  `amount` smallint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_tos` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_unit_album` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `unit_id` int(10) UNSIGNED NOT NULL,
  `rank_max_flag` tinyint(1) NOT NULL DEFAULT 0,
  `love_max_flag` tinyint(1) NOT NULL DEFAULT 0,
  `rank_level_max_flag` tinyint(1) NOT NULL DEFAULT 0,
  `all_max_flag` tinyint(1) NOT NULL DEFAULT 0,
  `highest_love_per_unit` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `total_love` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `favorite_point` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_unit_deck` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `unit_deck_id` tinyint(2) UNSIGNED NOT NULL,
  `deck_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No Name'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_unit_deck_slot` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `deck_id` tinyint(2) UNSIGNED NOT NULL,
  `slot_id` tinyint(1) UNSIGNED NOT NULL,
  `unit_owning_user_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_unit_removable_skill_equip` (
  `unit_owning_user_id` int(10) UNSIGNED NOT NULL,
  `unit_removable_skill_id` tinyint(2) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_unit_removable_skill_owning` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `unit_removable_skill_id` tinyint(2) UNSIGNED NOT NULL,
  `total_amount` smallint(4) UNSIGNED DEFAULT 0,
  `equipped_amount` smallint(6) NOT NULL DEFAULT 0,
  `insert_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `webview_announce` (
  `id` int(11) NOT NULL,
  `title` text CHARACTER SET utf8mb4 NOT NULL,
  `insert_date` datetime NOT NULL DEFAULT current_timestamp(),
  `description` text CHARACTER SET utf8mb4 NOT NULL,
  `body` text CHARACTER SET utf8mb4 DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `auth_recovery_codes`
  ADD PRIMARY KEY (`token`);

ALTER TABLE `error_log`
  ADD PRIMARY KEY (`error_id`);

ALTER TABLE `events_list`
  ADD PRIMARY KEY (`event_id`);

ALTER TABLE `event_duty_live_progress`
  ADD PRIMARY KEY (`user_id`,`room_id`),
  ADD KEY `FK_event_duty_lp_room_id` (`room_id`),
  ADD KEY `FK_event_duty_lp_user_id` (`user_id`);

ALTER TABLE `event_duty_rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD KEY `FK_duty_rooms_event_id` (`event_id`);

ALTER TABLE `event_duty_users`
  ADD PRIMARY KEY (`room_id`,`user_id`),
  ADD KEY `FK_event_duty_user_id` (`user_id`),
  ADD KEY `FK_event_duty_room_id` (`room_id`);

ALTER TABLE `event_festival_live_progress`
  ADD PRIMARY KEY (`event_id`,`user_id`),
  ADD KEY `FK_festival_lp_event_id` (`event_id`),
  ADD KEY `FK_festival_lp_user_id` (`user_id`);

ALTER TABLE `event_festival_users`
  ADD PRIMARY KEY (`event_id`,`user_id`),
  ADD KEY `FK_festival_event_id` (`event_id`),
  ADD KEY `FK_festival_user_id` (`user_id`);

ALTER TABLE `event_ranking`
  ADD PRIMARY KEY (`user_id`,`event_id`),
  ADD KEY `FK_event_ranking_user` (`user_id`),
  ADD KEY `fk_event_ranking_event` (`event_id`);

ALTER TABLE `exchange_cost`
  ADD KEY `FK_exchange_cost` (`exchange_item_id`);

ALTER TABLE `exchange_item`
  ADD PRIMARY KEY (`exchange_item_id`);

ALTER TABLE `exchange_log`
  ADD PRIMARY KEY (`exchange_item_id`,`user_id`),
  ADD KEY `FK_exchange_log_item` (`exchange_item_id`),
  ADD KEY `FK_exchange_log_user` (`user_id`);

ALTER TABLE `login_bonus_sheets`
  ADD PRIMARY KEY (`nlbonus_id`);

ALTER TABLE `login_bonus_sheets_items`
  ADD PRIMARY KEY (`nlbonus_item_id`),
  ADD KEY `login_bonus_sheets_items` (`nlbonus_id`);

ALTER TABLE `login_bonus_sheets_received`
  ADD KEY `login_bonus_sheets_rec_item` (`nlbonus_item_id`),
  ADD KEY `login_bonus_sheets_rec_user_id` (`user_id`);

ALTER TABLE `login_bonus_total`
  ADD PRIMARY KEY (`user_id`,`days`),
  ADD KEY `total_lbonus` (`user_id`);

ALTER TABLE `login_received_list`
  ADD KEY `fk_login_received_user` (`user_id`);

ALTER TABLE `reward_table`
  ADD PRIMARY KEY (`incentive_id`),
  ADD KEY `reward_user_id` (`user_id`),
  ADD KEY `incentive_user_id` (`user_id`,`incentive_id`);

ALTER TABLE `secretbox_button`
  ADD PRIMARY KEY (`button_id`),
  ADD KEY `FK_secretbox_button` (`secretbox_id`);

ALTER TABLE `secretbox_cost`
  ADD PRIMARY KEY (`cost_id`),
  ADD KEY `FK_secretbox_cost` (`button_id`);

ALTER TABLE `secretbox_list`
  ADD PRIMARY KEY (`secretbox_id`);

ALTER TABLE `secretbox_pon`
  ADD PRIMARY KEY (`user_id`,`secretbox_id`),
  ADD KEY `FK_secretbox_pon_sb` (`secretbox_id`);

ALTER TABLE `secretbox_step_up_settings`
  ADD KEY `secretbox_step_up_settings` (`secretbox_id`);

ALTER TABLE `units`
  ADD PRIMARY KEY (`unit_owning_user_id`),
  ADD KEY `fk_unit_owner` (`user_id`),
  ADD KEY `unit_owning_user_id_index` (`unit_owning_user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `user_partner` (`partner_unit`),
  ADD KEY `user_id_index` (`user_id`);

ALTER TABLE `user_award_unlock`
  ADD PRIMARY KEY (`user_id`,`award_id`);

ALTER TABLE `user_background_unlock`
  ADD PRIMARY KEY (`user_id`,`background_id`);

ALTER TABLE `user_banned`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `user_banned` (`user_id`);

ALTER TABLE `user_class_live_progress`
  ADD KEY `FK_user_class_live_progresss_user` (`user_id`);

ALTER TABLE `user_exchange_point`
  ADD PRIMARY KEY (`user_id`,`rarity`);

ALTER TABLE `user_friend`
  ADD PRIMARY KEY (`initiator_id`,`recipient_id`),
  ADD KEY `FK_user_friend_recipient_id` (`recipient_id`);

ALTER TABLE `user_greet`
  ADD PRIMARY KEY (`notice_id`),
  ADD KEY `FK_usergreeting_affector` (`affector_id`),
  ADD KEY `FK_usergreeting_recipient` (`receiver_id`);

ALTER TABLE `user_live_goal_rewards`
  ADD PRIMARY KEY (`user_id`,`live_goal_reward_id`);

ALTER TABLE `user_live_log`
  ADD KEY `FK_user_live_log` (`user_id`);

ALTER TABLE `user_live_progress`
  ADD PRIMARY KEY (`user_id`,`live_difficulty_id`),
  ADD KEY `FK_live_progress` (`user_id`,`deck_id`);

ALTER TABLE `user_live_status`
  ADD PRIMARY KEY (`user_id`,`live_difficulty_id`,`live_setting_id`);

ALTER TABLE `user_login`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `UNIQUE_login_key` (`login_key`),
  ADD KEY `FK_user_login` (`user_id`);

ALTER TABLE `user_notice`
  ADD PRIMARY KEY (`notice_id`),
  ADD KEY `FK_user_notice_affector` (`affector_id`);

ALTER TABLE `user_params`
  ADD PRIMARY KEY (`user_id`,`param_name`),
  ADD KEY `FK_user_params_user_id` (`user_id`);

ALTER TABLE `user_personal_notice`
  ADD PRIMARY KEY (`user_id`,`notice_id`),
  ADD KEY `notice_id` (`notice_id`),
  ADD KEY `FK_user_personal_notice` (`user_id`);

ALTER TABLE `user_stamp_deck`
  ADD PRIMARY KEY (`user_id`,`stamp_type`,`stamp_setting_id`,`main_flag`);

ALTER TABLE `user_stamp_deck_slot`
  ADD PRIMARY KEY (`user_id`,`stamp_type`,`stamp_setting_id`,`position`);

ALTER TABLE `user_support_unit`
  ADD PRIMARY KEY (`user_id`,`unit_id`);

ALTER TABLE `user_tos`
  ADD PRIMARY KEY (`user_id`);

ALTER TABLE `user_unit_album`
  ADD PRIMARY KEY (`user_id`,`unit_id`);

ALTER TABLE `user_unit_deck`
  ADD PRIMARY KEY (`user_id`,`unit_deck_id`);

ALTER TABLE `user_unit_deck_slot`
  ADD PRIMARY KEY (`user_id`,`deck_id`,`slot_id`),
  ADD UNIQUE KEY `unit_unique_per_deck` (`unit_owning_user_id`,`deck_id`);

ALTER TABLE `user_unit_removable_skill_equip`
  ADD PRIMARY KEY (`unit_owning_user_id`,`unit_removable_skill_id`),
  ADD KEY `user_skill_equip_index` (`unit_owning_user_id`,`unit_removable_skill_id`);

ALTER TABLE `user_unit_removable_skill_owning`
  ADD PRIMARY KEY (`user_id`,`unit_removable_skill_id`),
  ADD KEY `user_skill_owning_index` (`user_id`,`unit_removable_skill_id`);

ALTER TABLE `webview_announce`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `error_log`
  MODIFY `error_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `event_duty_rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `exchange_item`
  MODIFY `exchange_item_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `login_bonus_sheets`
  MODIFY `nlbonus_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `login_bonus_sheets_items`
  MODIFY `nlbonus_item_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `reward_table`
  MODIFY `incentive_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `secretbox_button`
  MODIFY `button_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `secretbox_cost`
  MODIFY `cost_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `secretbox_list`
  MODIFY `secretbox_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `units`
  MODIFY `unit_owning_user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_greet`
  MODIFY `notice_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_notice`
  MODIFY `notice_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_personal_notice`
  MODIFY `notice_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `webview_announce`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `event_duty_live_progress`
  ADD CONSTRAINT `FK_event_duty_lp_room_id` FOREIGN KEY (`room_id`) REFERENCES `event_duty_rooms` (`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_event_duty_lp_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `event_duty_rooms`
  ADD CONSTRAINT `FK_duty_rooms_event_id` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `event_duty_users`
  ADD CONSTRAINT `FK_event_duty_room_id` FOREIGN KEY (`room_id`) REFERENCES `event_duty_rooms` (`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_event_duty_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `event_festival_live_progress`
  ADD CONSTRAINT `FK_festival_lp_event_id` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_festival_lp_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `event_festival_users`
  ADD CONSTRAINT `FK_festival_event_id` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_festival_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `event_ranking`
  ADD CONSTRAINT `FK_event_ranking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_event_ranking_event` FOREIGN KEY (`event_id`) REFERENCES `events_list` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `exchange_cost`
  ADD CONSTRAINT `FK_exchange_cost` FOREIGN KEY (`exchange_item_id`) REFERENCES `exchange_item` (`exchange_item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `exchange_log`
  ADD CONSTRAINT `FK_exchange_log_item` FOREIGN KEY (`exchange_item_id`) REFERENCES `exchange_item` (`exchange_item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_exchange_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

ALTER TABLE `login_bonus_sheets_items`
  ADD CONSTRAINT `login_bonus_sheets_items` FOREIGN KEY (`nlbonus_id`) REFERENCES `login_bonus_sheets` (`nlbonus_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `login_bonus_sheets_received`
  ADD CONSTRAINT `login_bonus_sheets_rec_item` FOREIGN KEY (`nlbonus_item_id`) REFERENCES `login_bonus_sheets_items` (`nlbonus_item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `login_bonus_sheets_rec_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `login_bonus_total`
  ADD CONSTRAINT `total_lbonus` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `login_received_list`
  ADD CONSTRAINT `fk_login_received_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `reward_table`
  ADD CONSTRAINT `reward_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `secretbox_button`
  ADD CONSTRAINT `FK_secretbox_button` FOREIGN KEY (`secretbox_id`) REFERENCES `secretbox_list` (`secretbox_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `secretbox_cost`
  ADD CONSTRAINT `FK_secretbox_cost` FOREIGN KEY (`button_id`) REFERENCES `secretbox_button` (`button_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `secretbox_pon`
  ADD CONSTRAINT `FK_secretbox_pon_sb` FOREIGN KEY (`secretbox_id`) REFERENCES `secretbox_list` (`secretbox_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_secretbox_pon_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `secretbox_step_up_settings`
  ADD CONSTRAINT `secretbox_step_up_settings` FOREIGN KEY (`secretbox_id`) REFERENCES `secretbox_list` (`secretbox_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `units`
  ADD CONSTRAINT `fk_unit_owner` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `user_partner` FOREIGN KEY (`partner_unit`) REFERENCES `units` (`unit_owning_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_award_unlock`
  ADD CONSTRAINT `FK_award_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_background_unlock`
  ADD CONSTRAINT `FK_background_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_banned`
  ADD CONSTRAINT `user_banned` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

ALTER TABLE `user_class_live_progress`
  ADD CONSTRAINT `FK_user_class_live_progresss_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_exchange_point`
  ADD CONSTRAINT `fk_exchange_point_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_friend`
  ADD CONSTRAINT `FK_user_friend_initiator_id` FOREIGN KEY (`initiator_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_user_friend_recipient_id` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_greet`
  ADD CONSTRAINT `FK_usergreeting_affector` FOREIGN KEY (`affector_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_usergreeting_recipient` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_live_goal_rewards`
  ADD CONSTRAINT `FK_user_live_goal_rewards` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_live_log`
  ADD CONSTRAINT `FK_user_live_log` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_live_progress`
  ADD CONSTRAINT `FK_live_progress` FOREIGN KEY (`user_id`,`deck_id`) REFERENCES `user_unit_deck` (`user_id`, `unit_deck_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_live_status`
  ADD CONSTRAINT `FK_user_live_status` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_login`
  ADD CONSTRAINT `FK_user_login` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_notice`
  ADD CONSTRAINT `FK_user_notice_affector` FOREIGN KEY (`affector_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_params`
  ADD CONSTRAINT `FK_user_params_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_personal_notice`
  ADD CONSTRAINT `FK_user_personal_notice` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_stamp_deck`
  ADD CONSTRAINT `FK_user_stamp_deck` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_stamp_deck_slot`
  ADD CONSTRAINT `FK_stamp_slot` FOREIGN KEY (`user_id`,`stamp_type`,`stamp_setting_id`) REFERENCES `user_stamp_deck` (`user_id`, `stamp_type`, `stamp_setting_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_support_unit`
  ADD CONSTRAINT `fk_support_unit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_tos`
  ADD CONSTRAINT `FK_user_tos_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_unit_album`
  ADD CONSTRAINT `fk_album_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_unit_deck`
  ADD CONSTRAINT `fk_deck_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_unit_deck_slot`
  ADD CONSTRAINT `fk_slot_deck` FOREIGN KEY (`user_id`,`deck_id`) REFERENCES `user_unit_deck` (`user_id`, `unit_deck_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_slot_unit` FOREIGN KEY (`unit_owning_user_id`) REFERENCES `units` (`unit_owning_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_unit_removable_skill_equip`
  ADD CONSTRAINT `fk_removable_skill_equip_unit` FOREIGN KEY (`unit_owning_user_id`) REFERENCES `units` (`unit_owning_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_unit_removable_skill_owning`
  ADD CONSTRAINT `fk_removable_skill_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;