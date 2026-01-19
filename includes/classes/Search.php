<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Utils.php';

class Search {
    public static function users($query, $type, $viewerId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_media = $db->db_media;
        $limit = 20;
        $offset = intval($page) * $limit;
        $key = $db->escape($query);
        $viewerId = intval($viewerId);
        
        // Subqueries for counts
        $followingSub = "SELECT COUNT(*) FROM $db_user.follows WHERE user1_id = users.user_id";
        $followerSub = "SELECT COUNT(*) FROM $db_user.follows WHERE user2_id = users.user_id";
        
        // Select formatting
        $selects = "
            users.user_id, users.user_nickname, users.user_gender, users.user_hometown, 
            users.user_status, users.user_birthdate, users.user_firstname, users.user_lastname, 
            users.pfp_media_id, users.cover_media_id, users.user_about, users.verified,
            
            m_pfp.media_hash as pfp_media_hash,
            m_cov.media_hash as cover_media_hash,
            
            ($followingSub) as total_following,
            ($followerSub) as total_follower
        ";

        if ($type == 0) {
            // Global Search
            $sql = "
                SELECT $selects
                FROM $db_user.users 
                LEFT JOIN $db_media.media m_pfp ON users.pfp_media_id = m_pfp.media_id
                LEFT JOIN $db_media.media m_cov ON users.cover_media_id = m_cov.media_id
                WHERE users.user_firstname LIKE '%$key%' 
                   OR users.user_lastname LIKE '%$key%' 
                   OR users.user_email LIKE '%$key%' 
                   OR users.user_hometown LIKE '%$key%' 
                LIMIT $limit OFFSET $offset
            ";
        } elseif ($type == 2) {
            // Following (Users I follow)
             $sql = "
                SELECT $selects
                FROM $db_user.users
                JOIN $db_user.follows ON users.user_id = follows.user2_id
                LEFT JOIN $db_media.media m_pfp ON users.pfp_media_id = m_pfp.media_id
                LEFT JOIN $db_media.media m_cov ON users.cover_media_id = m_cov.media_id
                WHERE (
                    users.user_firstname LIKE '%$key%' OR
                    users.user_lastname LIKE '%$key%' OR
                    users.user_email LIKE '%$key%' OR
                    users.user_hometown LIKE '%$key%'
                ) AND follows.user1_id = $viewerId
                LIMIT $limit OFFSET $offset
            ";
        } elseif ($type == 3) {
             // Followers (Users following me)
             $sql = "
                SELECT $selects
                FROM $db_user.users
                JOIN $db_user.follows ON users.user_id = follows.user1_id
                LEFT JOIN $db_media.media m_pfp ON users.pfp_media_id = m_pfp.media_id
                LEFT JOIN $db_media.media m_cov ON users.cover_media_id = m_cov.media_id
                WHERE (
                    users.user_firstname LIKE '%$key%' OR
                    users.user_lastname LIKE '%$key%' OR
                    users.user_email LIKE '%$key%' OR
                    users.user_hometown LIKE '%$key%'
                ) AND follows.user2_id = $viewerId
                LIMIT $limit OFFSET $offset
            ";
        } else {
            return [];
        }

        $result = $db->query($sql);
        $rows = $result->fetch_all(MYSQLI_ASSOC);
        
        // Post-processing for text formatting only
        foreach ($rows as &$row) {
             $row["user_about"] = Utils::captionTrim($row['user_about']);
        }
        
        return $rows;
    }

    public static function groups($query, $viewerId, $page = 0) {
        $db = Database::getInstance();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $limit = 20;
        $offset = intval($page) * $limit;
        $key = $db->escape($query);
        $viewerId = intval($viewerId);
        
        $sql = "SELECT g.*, 
                (SELECT COUNT(*) FROM $db_post.group_members WHERE group_id = g.group_id AND status = 1) as member_count,
                m_pfp.media_hash as pfp_media_hash,
                m_cov.media_hash as cover_media_hash,
                (SELECT status FROM $db_post.group_members WHERE group_id = g.group_id AND user_id = $viewerId) as my_status
                FROM $db_post.groups g
                LEFT JOIN $db_media.media m_pfp ON g.pfp_media_id = m_pfp.media_id
                LEFT JOIN $db_media.media m_cov ON g.cover_media_id = m_cov.media_id
                WHERE (g.group_name LIKE '%$key%' OR g.group_about LIKE '%$key%')
                  AND g.group_privacy >= 1 -- Only public and closed groups are searchable
                ORDER BY member_count DESC
                LIMIT $limit OFFSET $offset";
        
        $result = $db->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
