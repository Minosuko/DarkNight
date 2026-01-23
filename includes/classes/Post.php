<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Utils.php';

class Post {
    public static function getFeed($userId, $page = 0) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        
        $limit = 30;
        $offset = intval($page) * $limit;
        $userId = intval($userId);

        // Subqueries for counts to avoid N+1 and allow scoring
        $likesSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = feed.post_id";
        $commentsSub = "SELECT COUNT(*) FROM $db_post.comments WHERE post_id = feed.post_id";
        $sharesSub = "SELECT COUNT(*) FROM $db_post.posts WHERE is_share = feed.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = feed.post_id AND user_id = $userId";
        
        // 1. My Posts
        $myPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.is_spoiler,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                   p.group_id, NULL as group_name, 0 as group_verified
            FROM $db_post.posts p
            JOIN $db_user.users u ON p.post_by = u.user_id
            WHERE u.user_id = $userId AND p.group_id = 0
        ";

        // 2. Followed Users Posts
        $followedPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.is_spoiler,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                   p.group_id, NULL as group_name, 0 as group_verified
            FROM $db_post.posts p
            JOIN $db_user.follows f ON p.post_by = f.user2_id
            JOIN $db_user.users u ON p.post_by = u.user_id
            WHERE p.post_public = 2 AND f.user1_id = $userId AND p.group_id = 0
        ";

        // 3. Friends Posts
        $friendsPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.is_spoiler,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                   p.group_id, NULL as group_name, 0 as group_verified
            FROM $db_post.posts p
            JOIN $db_user.users u ON p.post_by = u.user_id 
            JOIN (
                SELECT user1_id AS friend_id FROM $db_user.friendship WHERE user2_id = $userId AND friendship_status = 1
                UNION
                SELECT user2_id AS friend_id FROM $db_user.friendship WHERE user1_id = $userId AND friendship_status = 1
            ) friends ON friends.friend_id = p.post_by
            WHERE p.post_public >= 1 AND p.group_id = 0
        ";

        // 4. Community Posts (From joined groups)
        $communityPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.is_spoiler,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                   p.group_id, g.group_name, g.verified as group_verified
            FROM $db_post.posts p
            JOIN $db_user.users u ON p.post_by = u.user_id
            JOIN $db_post.group_members gm ON p.group_id = gm.group_id
            JOIN $db_post.groups g ON p.group_id = g.group_id
            WHERE gm.user_id = $userId AND gm.status = 1 AND p.group_id > 0
        ";

        $unionSql = "($myPosts) UNION ($followedPosts) UNION ($friendsPosts) UNION ($communityPosts)";

        $sql = "
            SELECT 
                feed.*,
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                -- Scoring calculation for weighting: Time + (Likes * 30m) + (Comments * 60m)
                (feed.post_time + (($likesSub) * 1800) + (($commentsSub) * 3600)) as hot_score,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.display_order ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
            shared_p.is_spoiler as shared_spoiler,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared_pfp.media_hash, ''), ':', IFNULL(m_shared_pfp.media_format, '')) ORDER BY m_map_shared.display_order ASC SEPARATOR ',') as shared_media_list,
                
                shared_u.user_firstname as shared_firstname,
                shared_u.user_lastname as shared_lastname,
                shared_u.user_nickname as shared_nickname,
                shared_u.user_gender as shared_gender,
                shared_u.pfp_media_id as shared_pfp_id,
                shared_u.verified as shared_verified,
                
                m_shared_pfp.media_hash as shared_pfp_hash,
                
                m_legacy.media_hash as post_media_hash,
                m_legacy.media_format as post_media_format,
                m_shared_legacy.media_hash as shared_media_hash,
                m_shared_legacy.media_format as shared_media_format,

                (SELECT COUNT(*) FROM $db_user.friendship WHERE 
                    (user1_id = $userId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $userId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM ($unionSql) as feed
            LEFT JOIN $db_post.post_media_mapping m_map ON feed.post_id = m_map.post_id
            LEFT JOIN $db_media.media m ON m_map.media_id = m.media_id
            LEFT JOIN $db_media.media m_pfp ON feed.pfp_media_id = m_pfp.media_id
            LEFT JOIN $db_media.media m_legacy ON feed.post_media = m_legacy.media_id
            
            LEFT JOIN $db_post.posts shared_p ON feed.is_share = shared_p.post_id
            LEFT JOIN $db_user.users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN $db_media.media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN $db_media.media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN $db_media.media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id
            
            GROUP BY feed.post_id
            ORDER BY hot_score DESC
            LIMIT $limit OFFSET $offset
        ";
        
        $query = $conn->query($sql);
        return $query->fetch_all(MYSQLI_ASSOC);
    }

    public static function getLikedPosts($userId, $page = 0) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        
        $limit = 30;
        $offset = intval($page) * $limit;
        $userId = intval($userId);

        // Subqueries for counts
        $likesSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id";
        $commentsSub = "SELECT COUNT(*) FROM $db_post.comments WHERE post_id = p.post_id";
        $sharesSub = "SELECT COUNT(*) FROM $db_post.posts WHERE is_share = p.post_id";
        $isLikedSub = "1"; // Since we are viewing liked posts, they are obviously liked by the viewer

        $sql = "
            SELECT 
                p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                g.group_id, g.group_name, g.verified as group_verified,
                
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                $isLikedSub as is_liked,
                
                p.post_time as hot_score,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.display_order ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
                shared_p.is_spoiler as shared_spoiler,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared.media_hash, ''), ':', IFNULL(m_shared.media_format, '')) ORDER BY m_map_shared.display_order ASC SEPARATOR ',') as shared_media_list,
                
                shared_u.user_firstname as shared_firstname,
                shared_u.user_lastname as shared_lastname,
                shared_u.user_nickname as shared_nickname,
                shared_u.user_gender as shared_gender,
                shared_u.pfp_media_id as shared_pfp_id,
                shared_u.verified as shared_verified,
                
                m_shared_pfp.media_hash as shared_pfp_hash

            FROM $db_post.likes l
            JOIN $db_post.posts p ON l.post_id = p.post_id
            JOIN $db_user.users u ON p.post_by = u.user_id
            LEFT JOIN $db_post.groups g ON p.group_id = g.group_id
            LEFT JOIN $db_post.post_media_mapping m_map ON p.post_id = m_map.post_id
            LEFT JOIN $db_media.media m ON m_map.media_id = m.media_id
            LEFT JOIN $db_media.media m_pfp ON u.pfp_media_id = m_pfp.media_id
            
            -- Shared Post Joins
            LEFT JOIN $db_post.posts shared_p ON p.is_share = shared_p.post_id
            LEFT JOIN $db_user.users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN $db_media.media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN $db_media.media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            
            WHERE l.user_id = $userId
            GROUP BY p.post_id
            ORDER BY p.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

        $query = $conn->query($sql);
        return $query->fetch_all(MYSQLI_ASSOC);
    }

    public static function getProfilePosts($targetUserId, $viewerUserId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $limit = 30;
        $offset = intval($page) * $limit;
        $targetUserId = intval($targetUserId);
        $viewerUserId = intval($viewerUserId);

        // Permissions Check Logic
        // Determine relationship: 0 = Self, 1 = Friend, 2 = Requested, 3 = Nothing
        $relationship = 3;
        if ($targetUserId == $viewerUserId) {
            $relationship = 0;
        } else {
            $sql = "SELECT friendship_status FROM $db_user.friendship WHERE 
                    (user1_id = $targetUserId AND user2_id = $viewerUserId) OR 
                    (user1_id = $viewerUserId AND user2_id = $targetUserId)";
            $res = $db->query($sql);
            if ($res->num_rows > 0) {
                $row = $res->fetch_assoc();
                if ($row['friendship_status'] == 1) $relationship = 1; // Friend
                else if ($row['friendship_status'] == 0) $relationship = 2; // Requested
            }
        }

        // Build Query based on relationship
        $privacyCondition = "p.post_public = 2"; // Public only by default
        if ($relationship == 0) {
            $privacyCondition = "1=1"; // See all
        } elseif ($relationship == 1) {
            $privacyCondition = "p.post_public >= 1"; // Public + Friends
        }

        // Reusing the optimize subqueries from getFeed
        $likesSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id";
        $commentsSub = "SELECT COUNT(*) FROM $db_post.comments WHERE post_id = p.post_id";
        $sharesSub = "SELECT COUNT(*) FROM $db_post.posts WHERE is_share = p.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id AND user_id = $viewerUserId";

        $sql = "
            SELECT 
                p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.group_id, p.is_spoiler,
                u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                u.user_birthdate, u.user_hometown, u.user_status, u.user_about,
                g.group_name, g.verified as group_verified,
                
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.display_order ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
            shared_p.is_spoiler as shared_spoiler,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared_pfp.media_hash, ''), ':', IFNULL(m_shared_pfp.media_format, '')) ORDER BY m_map_shared.display_order ASC SEPARATOR ',') as shared_media_list,
                
                shared_u.user_firstname as shared_firstname,
                shared_u.user_lastname as shared_lastname,
                shared_u.user_nickname as shared_nickname,
                shared_u.user_gender as shared_gender,
                shared_u.pfp_media_id as shared_pfp_id,
                shared_u.verified as shared_verified,
                
                m_shared_pfp.media_hash as shared_pfp_hash,
                
                m_legacy.media_hash as post_media_hash,
                m_legacy.media_format as post_media_format,
                m_shared_legacy.media_hash as shared_media_hash,
                m_shared_legacy.media_format as shared_media_format,

                (SELECT COUNT(*) FROM $db_user.friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM $db_post.posts p
            JOIN $db_user.users u ON p.post_by = u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map ON p.post_id = m_map.post_id
            LEFT JOIN $db_media.media m ON m_map.media_id = m.media_id
            LEFT JOIN $db_media.media m_pfp ON u.pfp_media_id = m_pfp.media_id
            LEFT JOIN $db_media.media m_legacy ON p.post_media = m_legacy.media_id
            LEFT JOIN $db_post.groups g ON p.group_id = g.group_id
            
            LEFT JOIN $db_post.posts shared_p ON p.is_share = shared_p.post_id
            LEFT JOIN $db_user.users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN $db_media.media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN $db_media.media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN $db_media.media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id

            WHERE p.post_by = $targetUserId AND $privacyCondition AND p.group_id = 0
            GROUP BY p.post_id
            ORDER BY p.is_pinned DESC, p.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
    
    public static function searchPosts($query, $viewerUserId, $page = 0, $filters = []) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $limit = 30;
        $offset = intval($page) * $limit;
        $viewerUserId = intval($viewerUserId);
        $escapedQuery = $db->escape($query);
        
        $scope = $filters['scope'] ?? 'all';
        $privacyFilter = $filters['privacy'] ?? 'all';
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        // Build base condition for search and dates
        $baseCond = "p.post_caption LIKE '%$escapedQuery%' AND p.group_id = 0";
        if ($startDate) {
            $sTime = strtotime($startDate);
            if ($sTime) $baseCond .= " AND p.post_time >= $sTime";
        }
        if ($endDate) {
            $eTime = strtotime($endDate) + 86399; // End of day
            if ($eTime) $baseCond .= " AND p.post_time <= $eTime";
        }

        // Privacy Specific Filter
        $pCond = "";
        if ($privacyFilter !== 'all') {
            $pCond = " AND p.post_public = " . intval($privacyFilter);
        }

        // Subqueries
        $likesSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = feed.post_id";
        $commentsSub = "SELECT COUNT(*) FROM $db_post.comments WHERE post_id = feed.post_id";
        $sharesSub = "SELECT COUNT(*) FROM $db_post.posts WHERE is_share = feed.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = feed.post_id AND user_id = $viewerUserId";

        $parts = [];

        // PART 1: My Posts (Always see all my own matching posts if scope allows)
        if ($scope === 'all' || $scope === 'me') {
            $parts[] = "
                SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_spoiler,
                       u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                       p.group_id, NULL as group_name, 0 as group_verified
                FROM $db_post.posts p
                JOIN $db_user.users u ON p.post_by = u.user_id
                WHERE u.user_id = $viewerUserId AND $baseCond $pCond
            ";
        }

        // PART 2: Public Posts (Global)
        if ($scope === 'all') {
            $parts[] = "
                 SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_spoiler,
                       u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                       p.group_id, NULL as group_name, 0 as group_verified
                FROM $db_post.posts p
                JOIN $db_user.users u ON p.post_by = u.user_id
                WHERE p.post_public = 2 AND $baseCond $pCond
            ";
        }

        // PART 3: Friends/Followed Posts (Scoped)
        if ($scope === 'all' || $scope === 'friends') {
            // Friend's Privacy-Restricted Posts
            $parts[] = "
                 SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_spoiler,
                       u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                       p.group_id, NULL as group_name, 0 as group_verified
                FROM $db_post.posts p
                JOIN $db_user.users u ON p.post_by = u.user_id 
                JOIN (
                    SELECT user1_id AS friend_id FROM $db_user.friendship WHERE user2_id = $viewerUserId AND friendship_status = 1
                    UNION
                    SELECT user2_id AS friend_id FROM $db_user.friendship WHERE user1_id = $viewerUserId AND friendship_status = 1
                ) friends ON friends.friend_id = p.post_by
                WHERE p.post_public >= 1 AND $baseCond $pCond
            ";

            // Followed Public Posts
            $parts[] = "
                SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_spoiler,
                       u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                       p.group_id, NULL as group_name, 0 as group_verified
                FROM $db_post.posts p
                JOIN $db_user.follows f ON p.post_by = f.user2_id
                JOIN $db_user.users u ON p.post_by = u.user_id
                WHERE p.post_public = 2 AND f.user1_id = $viewerUserId AND $baseCond $pCond
            ";
        }

        // PART 4: Joined Groups Posts
        if ($scope === 'all' || $scope === 'groups') {
            $specificGroupId = isset($filters['group_id']) ? (int)$filters['group_id'] : 0;
            $groupCond = $specificGroupId > 0 ? "p.group_id = $specificGroupId" : "p.group_id > 0";
            
            $parts[] = "
                SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_spoiler,
                       u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                       p.group_id, g.group_name, g.verified as group_verified
                FROM $db_post.posts p
                JOIN $db_user.users u ON p.post_by = u.user_id
                JOIN $db_post.group_members gm ON p.group_id = gm.group_id
                JOIN $db_post.groups g ON p.group_id = g.group_id
                WHERE gm.user_id = $viewerUserId AND gm.status = 1 AND p.post_caption LIKE '%$escapedQuery%'
                AND $groupCond
                " . ($startDate ? " AND p.post_time >= " . strtotime($startDate) : "") . "
                " . ($endDate ? " AND p.post_time <= " . (strtotime($endDate) + 86399) : "") . "
                $pCond
            ";
        }

        if (empty($parts)) return [];

        $unionSql = implode(" UNION ", $parts);
        
        $sql = "
             SELECT 
                feed.*,
                feed.group_name, feed.group_verified,
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.display_order ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
            shared_p.is_spoiler as shared_spoiler,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared_pfp.media_hash, ''), ':', IFNULL(m_shared_pfp.media_format, '')) ORDER BY m_map_shared.display_order ASC SEPARATOR ',') as shared_media_list,
                
                shared_u.user_firstname as shared_firstname,
                shared_u.user_lastname as shared_lastname,
                shared_u.user_nickname as shared_nickname,
                shared_u.user_gender as shared_gender,
                shared_u.pfp_media_id as shared_pfp_id,
                shared_u.verified as shared_verified,
                
                m_shared_pfp.media_hash as shared_pfp_hash,
                
                m_legacy.media_hash as post_media_hash,
                m_legacy.media_format as post_media_format,
                m_shared_legacy.media_hash as shared_media_hash,
                m_shared_legacy.media_format as shared_media_format,
 
                (SELECT COUNT(*) FROM $db_user.friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM ($unionSql) as feed
            LEFT JOIN $db_post.post_media_mapping m_map ON feed.post_id = m_map.post_id
            LEFT JOIN $db_media.media m ON m_map.media_id = m.media_id
            LEFT JOIN $db_media.media m_pfp ON feed.pfp_media_id = m_pfp.media_id
            LEFT JOIN $db_media.media m_legacy ON feed.post_media = m_legacy.media_id
            
            LEFT JOIN $db_post.posts shared_p ON feed.is_share = shared_p.post_id
            LEFT JOIN $db_user.users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN $db_media.media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN $db_media.media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN $db_media.media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id
            
            GROUP BY feed.post_id
            ORDER BY feed.post_time DESC
            LIMIT $limit OFFSET $offset
        ";
 
         return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
    public static function create($userId, $caption, $public, $fileData = null, $groupId = 0, $isSpoiler = 0) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $userId = intval($userId);
        $public = intval($public);
        $timestamp = time();
        $captionClean = $db->escape($caption);
        $groupId = intval($groupId);
        $isSpoiler = intval($isSpoiler);
        
        $sql = "INSERT INTO $db_post.posts (post_caption, post_public, post_time, post_by, group_id, is_spoiler) VALUES ('$captionClean', '$public', $timestamp, $userId, $groupId, $isSpoiler)";
        
        // Handle Multiple Files
        $hasMedia = false;
        if ($fileData !== null) {
            if (is_array($fileData['name'])) {
                 foreach($fileData['name'] as $k => $v) {
                     if (!empty($v)) $hasMedia = true;
                 }
            } else {
                if (!empty($fileData['name'])) $hasMedia = true;
            }
        }
        
        if ($hasMedia || !empty($caption)) {
            $db->query($sql);
        } else {
            return ['success' => 0, 'err' => 'empty_post'];
        }
        
        $lastId = $db->getLastId();
        $uploadedMedia = [];
        if ($hasMedia && $lastId) {
            $uploadedMedia = self::handleMediaUpload($lastId, $fileData);
        }

        return [
            'success' => 1,
            'post_id' => $lastId,
            'media_list' => $uploadedMedia
        ];
    }

    public static function share($userId, $originalPostId, $caption, $public, $fileData = null, $groupId = 0) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $userId = intval($userId);
        $originalPostId = intval($originalPostId);
        $public = intval($public);
        $groupId = intval($groupId);
        $timestamp = time();
        $captionClean = $db->escape($caption);
        
        // Check if original post exists and get its visibility
        $originalPostQuery = $db->query("SELECT post_by, post_public FROM $db_post.posts WHERE post_id = $originalPostId");
        if (!$originalPostQuery || $originalPostQuery->num_rows == 0) {
            return ['success' => 0, 'err' => 'original_post_not_found', 'message' => 'Original post not found'];
        }
        
        $originalPost = $originalPostQuery->fetch_assoc();
        $originalOwnerId = $originalPost['post_by'];
        $originalPostPublic = intval($originalPost['post_public']);
        
        // Validate: Only public posts can be shared to groups
        if ($groupId > 0) {
            if ($originalPostPublic != 2) {
                return ['success' => 0, 'err' => 'not_public', 'message' => 'Only public posts can be shared to groups'];
            }
            // Force privacy to public (2) when sharing to group
            $public = 2;
        }
        
        $sql = "INSERT INTO $db_post.posts (post_caption, post_public, post_time, post_by, is_share, group_id) VALUES ('$captionClean', '$public', $timestamp, $userId, $originalPostId, $groupId)";
        
        $db->query($sql);
        $lastId = $db->getLastId();
        
        if ($lastId) {
            // Handle Media if any
            if ($fileData !== null) {
                self::handleMediaUpload($lastId, $fileData);
            }

            // TRIGGER NOTIFICATION
            require_once __DIR__ . '/Notification.php';
            $notif = new Notification();
            // Notify owner of ORIGINAL post (already fetched above)
            if ($originalOwnerId != $userId) {
                $notif->create($originalOwnerId, $userId, 'share', $lastId);
            }

            return ['success' => 1, 'post_id' => $lastId];
        }
        
        return ['success' => 0, 'err' => 'db_error'];
    }

    private static function handleMediaUpload($postId, $fileData) {
        $db = Database::getInstance();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $files = [];
        $uploadedList = [];

        // Early debug logging
        error_log("handleMediaUpload called for post $postId");
        error_log("fileData structure: " . print_r($fileData, true));

        if (is_array($fileData['name'])) {
            $count = count($fileData['name']);
            error_log("File count received: $count");
            if ($count > 60) $count = 60; // Limit to 60 files
            for($i=0; $i<$count; $i++) {
                if(empty($fileData['name'][$i])) continue;
                $files[] = [
                    'name' => $fileData['name'][$i],
                    'type' => $fileData['type'][$i],
                    'tmp_name' => $fileData['tmp_name'][$i],
                    'error' => $fileData['error'][$i],
                    'size' => $fileData['size'][$i]
                ];
            }
        } else {
            $files[] = $fileData;
        }

        error_log("Processed files array count: " . count($files));
        
        $supported_ext = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "webm", "mp4", "mpeg"];
        $hasVideo = false;

        foreach($files as $index => $file) {
            if ($file['error'] !== UPLOAD_ERR_OK) {
                error_log("Upload error for file {$file['name']}: {$file['error']}");
                continue;
            }

            $filename = basename($file["name"]);
            $filetype = pathinfo($filename, PATHINFO_EXTENSION);
            
            if (in_array(strtolower($filetype), $supported_ext)) {
                $mediaHash = md5_file($file["tmp_name"]);
                
                // MIME type detection with extension fallback
                $ext = strtolower($filetype);
                $mimeMap = [
                    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
                    'gif' => 'image/gif', 'bmp' => 'image/bmp', 'webp' => 'image/webp',
                    'webm' => 'video/webm', 'mp4' => 'video/mp4', 'mpeg' => 'video/mpeg',
                    'mov' => 'video/quicktime', 'avi' => 'video/x-msvideo'
                ];
                
                $mediaFormat = '';
                if (function_exists('mime_content_type')) {
                    $mediaFormat = mime_content_type($file["tmp_name"]);
                }
                
                // Fallback to extension-based detection if MIME is generic or empty
                if (empty($mediaFormat) || $mediaFormat === 'application/octet-stream') {
                    $mediaFormat = isset($mimeMap[$ext]) ? $mimeMap[$ext] : 'application/octet-stream';
                    echo("MIME fallback to extension for {$file['name']}: $mediaFormat");
                }

                $filePath = null;
                $uploadAllowed = false;
                
                // Debug logging
                echo("Processing file: {$file['name']}, MIME: $mediaFormat, Hash: $mediaHash");
                
                if (strpos($mediaFormat, 'image/') === 0) {
                    $filePath = __DIR__ . "/../../data/images/image/$mediaHash.bin";
                    $uploadAllowed = true;
                } elseif (strpos($mediaFormat, 'video/') === 0) {
                    if ($hasVideo) {
                        echo("Extra video skipped for post $postId: " . $file['name']);
                        continue;
                    }
                    $filePath = __DIR__ . "/../../data/videos/video/$mediaHash.bin";
                    $uploadAllowed = true;
                    $hasVideo = true;
                } else {
                    echo("Unrecognized MIME type for file {$file['name']}: $mediaFormat");
                }
                
                if ($uploadAllowed) {
                    $check = $db->query("SELECT media_id FROM $db_media.media WHERE media_hash = '$mediaHash'");
                    $mediaId = 0;
                    if ($check->num_rows == 0) {
                        $db->query("INSERT INTO $db_media.media (media_format, media_hash, media_ext) VALUES ('$mediaFormat','$mediaHash', '$filetype')");
                        $mediaId = $db->getLastId();
                    } else {
                        $mediaId = $check->fetch_assoc()["media_id"];
                    }
                    
                    // Create directory if not exists
                    $dir = dirname($filePath);
                    if (!is_dir($dir)) {
                        mkdir($dir, 0777, true);
                    }

                    $moveSuccess = false;
                    if (file_exists($filePath)) {
                        $moveSuccess = true; // Already exists, consider success (dedup)
                    } elseif (php_sapi_name() === 'cli') {
                         $moveSuccess = rename($file["tmp_name"], $filePath);
                    } else {
                         $moveSuccess = move_uploaded_file($file["tmp_name"], $filePath);
                    }

                    if ($moveSuccess) {
                            // index in $files is correct order
                            $db->query("INSERT INTO $db_post.post_media_mapping (post_id, media_id, display_order) VALUES ($postId, $mediaId, $index)");
                            
                            // Legacy support: set first media as post_media
                            $db->query("UPDATE $db_post.posts SET post_media = $mediaId WHERE post_id = $postId AND post_media IS NULL");

                            $uploadedList[] = [
                                'media_id' => $mediaId,
                                'media_hash' => $mediaHash,
                                'media_format' => $mediaFormat
                            ];
                    } else {
                        error_log("Failed to move uploaded file: $filePath");
                    }
                } else {
                    error_log("Upload type not allowed or detection failed: " . $file['name']);
                }
            } else {
                error_log("Extension not supported: $filetype");
            }
        }
        return $uploadedList;
    }

    public static function getPost($postId, $viewerUserId) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $postId = intval($postId);
        $viewerUserId = intval($viewerUserId);

        // Subqueries
        $likesSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id";
        $commentsSub = "SELECT COUNT(*) FROM $db_post.comments WHERE post_id = p.post_id";
        $sharesSub = "SELECT COUNT(*) FROM $db_post.posts WHERE is_share = p.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id AND user_id = $viewerUserId";

        $sql = "
            SELECT 
                p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.is_spoiler, p.group_id,
                u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                g.group_name, g.verified as group_verified,
                
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.display_order ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
            shared_p.is_spoiler as shared_spoiler,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared.media_hash, ''), ':', IFNULL(m_shared.media_format, '')) ORDER BY m_map_shared.display_order ASC SEPARATOR ',') as shared_media_list,
                
                shared_u.user_firstname as shared_firstname,
                shared_u.user_lastname as shared_lastname,
                shared_u.user_nickname as shared_nickname,
                shared_u.user_gender as shared_gender,
                shared_u.pfp_media_id as shared_pfp_id,
                shared_u.verified as shared_verified,
                
                m_shared_pfp.media_hash as shared_pfp_hash,
                
                m_legacy.media_hash as post_media_hash,
                m_legacy.media_format as post_media_format,
                m_shared_legacy.media_hash as shared_media_hash,
                m_shared_legacy.media_format as shared_media_format,

                (SELECT COUNT(*) FROM $db_user.friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM $db_post.posts p
            JOIN $db_user.users u ON p.post_by = u.user_id
            LEFT JOIN $db_post.groups g ON p.group_id = g.group_id
            LEFT JOIN $db_post.post_media_mapping m_map ON p.post_id = m_map.post_id
            LEFT JOIN $db_media.media m ON m_map.media_id = m.media_id
            LEFT JOIN $db_media.media m_pfp ON u.pfp_media_id = m_pfp.media_id
            LEFT JOIN $db_media.media m_legacy ON p.post_media = m_legacy.media_id
            
            LEFT JOIN $db_post.posts shared_p ON p.is_share = shared_p.post_id
            LEFT JOIN $db_user.users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN $db_media.media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN $db_media.media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN $db_media.media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id

            WHERE p.post_id = $postId
            GROUP BY p.post_id
        ";

        $res = $db->query($sql);
        if ($res->num_rows == 0) return null;
        
        $post = $res->fetch_assoc();
        
        // Inject is_mine flag
        $post['is_mine'] = ($post['post_by'] == $viewerUserId) ? 1 : 0;
        
        // Visibility check
        $can_view = false;
        if ($post['post_public'] == 2) {
            $can_view = true;
        } elseif ($post['post_by'] == $viewerUserId) {
            $can_view = true;
        } elseif ($post['post_public'] == 1) {
            // Check friendship
            $checkFriend = $db->query("SELECT friendship_status FROM $db_user.friendship WHERE 
                    ((user1_id = {$post['post_by']} AND user2_id = $viewerUserId) OR 
                     (user1_id = $viewerUserId AND user2_id = {$post['post_by']})) AND friendship_status = 1");
            if ($checkFriend->num_rows > 0) $can_view = true;
        }

        if (!$can_view) return null;
        
        return $post;
    }

    public static function togglePin($postId, $userId) {
        $db = Database::getInstance();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $postId = intval($postId);
        $userId = intval($userId);

        // 1. Get Post Info
        $res = $db->query("SELECT group_id, post_by, is_pinned FROM $db_post.posts WHERE post_id = $postId");
        if ($res->num_rows == 0) return ['success' => 0, 'err' => 'post_not_found'];
        $post = $res->fetch_assoc();
        
        $groupId = intval($post['group_id']);
        $postOwner = intval($post['post_by']);
        $currentPinned = intval($post['is_pinned']);

        // 2. Permission Check
        $canPin = false;
        if ($groupId > 0) {
            // Group Context: User must be Admin of the group
            // We need a way to check if user is admin. The Group class has a check but we are in Post.
            // Let's do a direct query for speed or duplicate logic.
            // Access level: 2 = Admin, 1 = Member. Assuming 2 is admin/creator.
            $check = $db->query("SELECT role FROM $db_post.group_members WHERE group_id = $groupId AND user_id = $userId AND status = 1");
            if ($check->num_rows > 0) {
                $role = $check->fetch_assoc()['role'];
                if ($role >= 2) $canPin = true;
            }
        } else {
            // Profile Context: User must be the owner of the post AND the post must be on their profile (which is implied if it's their post unless we have wall posts)
            // For now, assuming only self-posts can be pinned on profile.
            if ($postOwner == $userId) $canPin = true;
        }

        if (!$canPin) return ['success' => 0, 'err' => 'unauthorized'];

        // 3. Logic: If pinning (current is 0), unpin ALL other posts in this context first.
        if ($currentPinned == 0) {
            if ($groupId > 0) {
                $db->query("UPDATE $db_post.posts SET is_pinned = 0 WHERE group_id = $groupId");
            } else {
                $db->query("UPDATE $db_post.posts SET is_pinned = 0 WHERE post_by = $userId AND group_id = 0");
            }
            // Pin this one
            $db->query("UPDATE $db_post.posts SET is_pinned = 1 WHERE post_id = $postId");
            return ['success' => 1, 'status' => 'pinned'];
        } else {
            // Unpinning
            $db->query("UPDATE $db_post.posts SET is_pinned = 0 WHERE post_id = $postId");
            return ['success' => 1, 'status' => 'unpinned'];
        }
    }

    public static function delete($postId, $userId) {
        $db = Database::getInstance();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $postId = $db->escape($postId);
        $userId = $db->escape($userId);

        // Verify ownership OR Group Admin permission
        $res = $db->query("SELECT post_by, group_id FROM $db_post.posts WHERE post_id = $postId");
        if ($res->num_rows == 0) return ["success" => 0, "err" => "post_not_found"];
        $post = $res->fetch_assoc();
        
        $can_delete = false;
        if ($post['post_by'] == $userId) {
            $can_delete = true;
        } elseif ($post['group_id'] > 0) {
            // Check if user is admin of this group
            $checkAdmin = $db->query("SELECT role FROM $db_post.group_members WHERE group_id = {$post['group_id']} AND user_id = $userId AND status = 1");
            if ($checkAdmin->num_rows > 0) {
                $role = $checkAdmin->fetch_assoc()['role'];
                if ($role >= 2) $can_delete = true;
            }
        }

        if (!$can_delete) {
            return ["success" => 0, "err" => "Unauthorized"];
        }

        // Delete post
        $db->query("DELETE FROM $db_post.posts WHERE post_id = $postId");
        // Also delete mappings (media is kept in media table for now, but mapping is removed)
        $db->query("DELETE FROM $db_post.post_media_mapping WHERE post_id = $postId");
        // Delete likes/comments if they exist in schema
        $db->query("DELETE FROM $db_post.likes WHERE post_id = $postId");
        $db->query("DELETE FROM $db_post.comments WHERE post_id = $postId");

        return ["success" => 1];
    }

    public static function update($postId, $userId, $caption, $public) {
        $db = Database::getInstance();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $postId = $db->escape($postId);
        $userId = $db->escape($userId);
        $caption = $db->escape($caption);
        $public = $db->escape($public);

        // Verify ownership
        $check = $db->query("SELECT post_id FROM $db_post.posts WHERE post_id = $postId AND post_by = $userId");
        if ($check->num_rows == 0) {
            return ["success" => 0, "err" => "Unauthorized or post not found"];
        }

        // Update post
        $db->query("UPDATE $db_post.posts SET post_caption = '$caption', post_public = '$public' WHERE post_id = $postId");

        return ["success" => 1];
    }
    public static function getProfileMedia($targetUserId, $viewerUserId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $limit = 30;
        $offset = intval($page) * $limit;
        $targetUserId = intval($targetUserId);
        $viewerUserId = intval($viewerUserId);

        // Permissions Check Logic
        $relationship = 3;
        if ($targetUserId == $viewerUserId) {
            $relationship = 0;
        } else {
            $sql = "SELECT friendship_status FROM $db_user.friendship WHERE 
                    (user1_id = $targetUserId AND user2_id = $viewerUserId) OR 
                    (user1_id = $viewerUserId AND user2_id = $targetUserId)";
            $res = $db->query($sql);
            if ($res->num_rows > 0) {
                $row = $res->fetch_assoc();
                if ($row['friendship_status'] == 1) $relationship = 1; // Friend
                else if ($row['friendship_status'] == 0) $relationship = 2; // Requested
            }
        }

        $privacyCondition = "p.post_public = 2";
        if ($relationship == 0) {
            $privacyCondition = "1=1";
        } elseif ($relationship == 1) {
            $privacyCondition = "p.post_public >= 1";
        }

        // Query first media item per post (one thumbnail per post, not per image)
        $sql = "
            SELECT 
                m.media_id, m.media_hash, m.media_format, p.post_id, p.is_spoiler,
                (SELECT COUNT(*) FROM $db_post.post_media_mapping WHERE post_id = p.post_id) as media_count
            FROM $db_post.posts p
            JOIN $db_post.post_media_mapping m_map ON p.post_id = m_map.post_id
            JOIN $db_media.media m ON m_map.media_id = m.media_id
            WHERE p.post_by = $targetUserId AND $privacyCondition AND p.group_id = 0
                AND m_map.display_order = (
                    SELECT MIN(display_order) FROM $db_post.post_media_mapping WHERE post_id = p.post_id
                )
            GROUP BY p.post_id
            ORDER BY p.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public static function getGroupPosts($groupId, $viewerUserId, $page = 0) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        
        $limit = 30;
        $offset = intval($page) * $limit;
        $groupId = intval($groupId);
        $viewerUserId = intval($viewerUserId);

        // Subqueries for counts
        $likesSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id";
        $commentsSub = "SELECT COUNT(*) FROM $db_post.comments WHERE post_id = p.post_id";
        $sharesSub = "SELECT COUNT(*) FROM $db_post.posts WHERE is_share = p.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM $db_post.likes WHERE post_id = p.post_id AND user_id = $viewerUserId";

        $sql = "
            SELECT 
                p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share, p.is_pinned, p.group_id, p.is_spoiler,
                u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                g.group_name, g.verified as group_verified,
                
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.display_order ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
                shared_p.is_spoiler as shared_spoiler,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared_pfp.media_hash, ''), ':', IFNULL(m_shared_pfp.media_format, '')) ORDER BY m_map_shared.display_order ASC SEPARATOR ',') as shared_media_list,
                
                shared_u.user_firstname as shared_firstname,
                shared_u.user_lastname as shared_lastname,
                shared_u.user_nickname as shared_nickname,
                shared_u.user_gender as shared_gender,
                shared_u.pfp_media_id as shared_pfp_id,
                shared_u.verified as shared_verified,
                
                m_shared_pfp.media_hash as shared_pfp_hash,
                
                m_legacy.media_hash as post_media_hash,
                m_legacy.media_format as post_media_format,
                m_shared_legacy.media_hash as shared_media_hash,
                m_shared_legacy.media_format as shared_media_format,

                (SELECT COUNT(*) FROM $db_user.friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM $db_post.posts p
            JOIN $db_user.users u ON p.post_by = u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map ON p.post_id = m_map.post_id
            LEFT JOIN $db_media.media m ON m_map.media_id = m.media_id
            LEFT JOIN $db_media.media m_pfp ON u.pfp_media_id = m_pfp.media_id
            LEFT JOIN $db_media.media m_legacy ON p.post_media = m_legacy.media_id
            LEFT JOIN $db_post.groups g ON p.group_id = g.group_id
            
            LEFT JOIN $db_post.posts shared_p ON p.is_share = shared_p.post_id
            LEFT JOIN $db_user.users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN $db_post.post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN $db_media.media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN $db_media.media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN $db_media.media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id

            WHERE p.group_id = $groupId
            GROUP BY p.post_id
            ORDER BY p.is_pinned DESC, p.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public static function getGroupMedia($groupId, $viewerUserId, $page = 0) {
        $db = Database::getInstance();
        $db_post = $db->db_post;
        $db_media = $db->db_media;
        $limit = 30;
        $offset = intval($page) * $limit;
        $groupId = intval($groupId);
        $viewerUserId = intval($viewerUserId);

        // Security Check: If group is Secret or Closed, check membership
        $sqlG = "SELECT group_privacy FROM $db_post.groups WHERE group_id = $groupId";
        $resG = $db->query($sqlG);
        if ($resG->num_rows == 0) return [];
        $gInfo = $resG->fetch_assoc();

        if ($gInfo['group_privacy'] < 2) {
            $sqlM = "SELECT id FROM $db_post.group_members WHERE group_id = $groupId AND user_id = $viewerUserId AND status = 1";
            $resM = $db->query($sqlM);
            if ($resM->num_rows == 0) return [];
        }

        // Query media items for this group
        $sql = "
            SELECT 
                m.media_id, m.media_hash, m.media_format, p.post_id, p.is_spoiler,
                (SELECT COUNT(*) FROM $db_post.post_media_mapping WHERE post_id = p.post_id) as media_count
            FROM $db_post.posts p
            JOIN $db_post.post_media_mapping m_map ON p.post_id = m_map.post_id
            JOIN $db_media.media m ON m_map.media_id = m.media_id
            WHERE p.group_id = $groupId
                AND m_map.display_order = (
                    SELECT MIN(display_order) FROM $db_post.post_media_mapping WHERE post_id = p.post_id
                )
            GROUP BY p.post_id
            ORDER BY p.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
}
