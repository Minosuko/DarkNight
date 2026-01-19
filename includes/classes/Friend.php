<?php
require_once __DIR__ . '/Database.php';

class Friend {
    public static function getList($userId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_media = $db->db_media;
        $limit = 20;
        $offset = intval($page) * $limit;
        $userId = intval($userId);

        $sql = "
            SELECT 
                u.user_id, u.user_firstname, u.user_lastname, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                m.media_hash as pfp_media_hash,
                s.last_online
            FROM $db_user.users u
            JOIN (
                SELECT user1_id AS friend_id FROM $db_user.friendship WHERE user2_id = $userId AND friendship_status = 1
                UNION
                SELECT user2_id AS friend_id FROM $db_user.friendship WHERE user1_id = $userId AND friendship_status = 1
            ) f ON f.friend_id = u.user_id
            LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
            LEFT JOIN (
                SELECT user_id, MAX(last_online) as last_online 
                FROM $db_user.session 
                GROUP BY user_id
            ) s ON u.user_id = s.user_id
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public static function getRequests($userId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_media = $db->db_media;
        $limit = 20;
        $offset = intval($page) * $limit;
        $userId = intval($userId);
        
        // Incoming requests: user2_id is me, user1_id is requester, status = 0
        $sql = "
            SELECT 
                u.user_id, u.user_firstname, u.user_lastname, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                m.media_hash as pfp_media_hash
            FROM $db_user.users u
            JOIN $db_user.friendship f ON f.user1_id = u.user_id
            LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
            WHERE f.user2_id = $userId AND f.friendship_status = 0
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
}
