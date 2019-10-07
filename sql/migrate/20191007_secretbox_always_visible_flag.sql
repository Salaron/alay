ALTER TABLE `secretbox_list`
	ADD COLUMN `always_visible` TINYINT(1) UNSIGNED NULL DEFAULT '0' AFTER `banner_se_asset_name`;
