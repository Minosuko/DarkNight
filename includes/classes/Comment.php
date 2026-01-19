<?php
require_once __DIR__ . '/Database.php';

class Comment {
    public static function getComments($postId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $limit = 10;
        $offset = intval($page) * $limit;
        $postId = intval($postId);

        $sql = "
            SELECT 
                c.post_id, c.comment, c.comment_time, c.user_id,
                u.pfp_media_id, u.user_nickname, u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.verified,
                m.media_hash as pfp_media_hash
            FROM $db_post.comments c
            JOIN $db_user.users u ON c.user_id = u.user_id
            LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
            WHERE c.post_id = $postId
            ORDER BY c.comment_time
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
}
