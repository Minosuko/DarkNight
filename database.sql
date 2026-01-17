SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text COLLATE utf8mb4_bin NOT NULL,
  `comment_media` int(11) NOT NULL,
  `comment_time` int(11) NOT NULL,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `follows` (
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `friendship` (
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `friendship_status` int(11) NOT NULL,
  KEY `user1_id` (`user1_id`),
  KEY `user2_id` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `likes` (
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `media` (
  `media_id` int(11) NOT NULL AUTO_INCREMENT,
  `media_hash` varchar(255) CHARACTER SET utf8 NOT NULL,
  `media_format` varchar(255) CHARACTER SET utf8 NOT NULL,
  `media_ext` varchar(255) CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`media_id`),
  UNIQUE KEY `media_hash` (`media_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE IF NOT EXISTS `posts` (
  `post_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_caption` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `post_time` int(11) NOT NULL,
  `post_public` char(1) CHARACTER SET utf8 NOT NULL,
  `post_by` int(11) NOT NULL,
  `post_media` int(11) NOT NULL DEFAULT 0,
  `is_share` int(11) NOT NULL DEFAULT 0,
  `allow_comment` int(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`post_id`),
  KEY `post_by` (`post_by`)
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



CREATE TABLE IF NOT EXISTS `webauthn_credentials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `credential_id` VARCHAR(512) NOT NULL,
  `public_key` TEXT NOT NULL,
  `counter` INT DEFAULT 0,
  `name` VARCHAR(255) DEFAULT 'Security Key',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_used` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES users(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY unique_credential (credential_id(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `actor_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `reference_id` INT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES users(`user_id`),
  FOREIGN KEY (`actor_id`) REFERENCES users(`user_id`),
  FOREIGN KEY (`reference_id`) REFERENCES posts(`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `twofactorauth` (
  `auth_key` VARCHAR(32) NOT NULL,
  `user_id` INT NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `backup_codes` TEXT NULL,
  UNIQUE KEY `user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `post_media_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `media_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `media_id` (`media_id`),
  FOREIGN KEY (`post_id`) REFERENCES posts(`post_id`) ON DELETE CASCADE,
  FOREIGN KEY (`media_id`) REFERENCES media(`media_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `groups` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `group_about` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `group_privacy` int(1) NOT NULL DEFAULT 2, -- 0: Secret, 1: Closed, 2: Public
  `pfp_media_id` int(11) NOT NULL DEFAULT 0,
  `cover_media_id` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_time` int(11) NOT NULL,
  PRIMARY KEY (`group_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `group_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` int(1) NOT NULL DEFAULT 0, -- 0: Member, 1: Mod, 2: Admin
  `status` int(1) NOT NULL DEFAULT 1, -- 0: Pending, 1: Joined
  `joined_time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_user` (`group_id`, `user_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update posts table to support group ID
ALTER TABLE `posts` ADD `group_id` INT(11) NOT NULL DEFAULT 0 AFTER `post_by`;
ALTER TABLE `posts` ADD INDEX (`group_id`);

COMMIT;