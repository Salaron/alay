ALTER TABLE `secretbox_list`
	CHANGE COLUMN `upper_limit` `upper_limit` INT(11) NOT NULL DEFAULT '0' AFTER `add_gauge`;