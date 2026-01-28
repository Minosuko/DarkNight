SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `posts` (
  `post_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_caption` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `post_time` int(11) NOT NULL,
  `post_public` char(1) CHARACTER SET utf8 NOT NULL,
  `post_by` int(11) NOT NULL,
  `group_id` INT(11) NOT NULL DEFAULT 0,
  `post_media` int(11) NOT NULL DEFAULT 0,
  `is_share` int(11) NOT NULL DEFAULT 0,
  `allow_comment` int(1) NOT NULL DEFAULT 1,
  `is_pinned` int(1) NOT NULL DEFAULT 0,
  `is_spoiler` int(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`post_id`),
  KEY `post_by` (`post_by`),
  KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text COLLATE utf8mb4_bin NOT NULL,
  `comment_media` int(11) NOT NULL,
  `comment_time` int(11) NOT NULL,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `likes` (
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `post_media_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `media_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `media_id` (`media_id`)
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
  `verified` int(1) NOT NULL DEFAULT 0,
  `group_rules` text DEFAULT NULL,
  `is_banned` tinyint(1) NOT NULL DEFAULT 0,
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
  UNIQUE KEY `group_user` (`group_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `hashtags` (
    `tag_id` INT AUTO_INCREMENT PRIMARY KEY,
    `tag_name` VARCHAR(150) UNIQUE NOT NULL,
    `created_at` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `post_hashtags` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `tag_id` INT NOT NULL,
    `created_at` INT NOT NULL,
    KEY `idx_tag_time` (`tag_id`, `created_at`),
    KEY `idx_post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;