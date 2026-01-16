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
