CREATE TABLE `auth_recovery_codes` (
	`token` VARCHAR(100) NOT NULL DEFAULT '',
	`code` VARCHAR(10) NOT NULL DEFAULT '',
	`mail` VARCHAR(100) NOT NULL DEFAULT '',
	`expire` TIMESTAMP NOT NULL,
	PRIMARY KEY (`token`)
) ENGINE=InnoDB COLLATE='utf8mb4_general_ci';
