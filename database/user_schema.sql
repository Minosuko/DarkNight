SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `active` int(1) NOT NULL DEFAULT 0,
  `user_firstname` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_lastname` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_nickname` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  `user_password` varchar(255) CHARACTER SET utf8 NOT NULL,
  `user_email` varchar(255) CHARACTER SET utf8 NOT NULL,
  `user_gender` char(1) CHARACTER SET utf8 NOT NULL,
  `user_birthdate` int(11) NOT NULL,
  `user_create_date` int(11) NOT NULL,
  `user_status` char(1) CHARACTER SET utf8 DEFAULT 'N',
  `relationship_user_id` INT(11) NOT NULL DEFAULT 0,
  `user_about` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_hometown` varchar(255) CHARACTER SET utf8 NOT NULL,
  `pfp_media_id` int(11) NOT NULL,
  `cover_media_id` int(11) NOT NULL,
  `verified` int(1) NOT NULL DEFAULT 0,
  `online_status` int(1) NOT NULL DEFAULT 1,
  `last_username_change` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_email` (`user_email`),
  UNIQUE KEY `user_nickname` (`user_nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `session` (
  `session_id` varchar(32) CHARACTER SET utf8 NOT NULL,
  `session_token` varchar(255) CHARACTER SET utf8 NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_device` varchar(255) CHARACTER SET utf8 NOT NULL,
  `session_os` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `session_browser` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `session_os_ver` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `session_browser_ver` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `session_ip` varchar(255) CHARACTER SET utf8 NOT NULL,
  `session_valid` int(11) NOT NULL DEFAULT 0,
  `last_online` int(11) NOT NULL DEFAULT 0,
  `browser_id` varchar(32) CHARACTER SET utf8 NOT NULL,
  `login_time` int(11) NOT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `webauthn_credentials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `credential_id` VARCHAR(512) NOT NULL,
  `public_key` TEXT NOT NULL,
  `counter` INT DEFAULT 0,
  `name` VARCHAR(255) DEFAULT 'Security Key',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_used` TIMESTAMP NULL,
  UNIQUE KEY unique_credential (credential_id(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `actor_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `reference_id` INT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `twofactorauth` (
  `auth_key` VARCHAR(32) NOT NULL,
  `user_id` INT NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `backup_codes` TEXT NULL,
  UNIQUE KEY `user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `friendship` (
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `friendship_status` int(11) NOT NULL,
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `follows` (
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  INDEX (`email`),
  INDEX (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
COMMIT;
