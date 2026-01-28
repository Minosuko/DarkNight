SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `reporter_id` int(11) NOT NULL,
  `target_type` varchar(20) NOT NULL, -- 'post', 'user', 'group'
  `target_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` int(1) NOT NULL DEFAULT 0, -- 0: Pending, 1: Resolved, 2: Ignored
  `created_time` int(11) NOT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
