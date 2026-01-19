SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `media` (
  `media_id` int(11) NOT NULL AUTO_INCREMENT,
  `media_hash` varchar(255) CHARACTER SET utf8 NOT NULL,
  `media_format` varchar(255) CHARACTER SET utf8 NOT NULL,
  `media_ext` varchar(255) CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`media_id`),
  UNIQUE KEY `media_hash` (`media_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
