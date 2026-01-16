<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Utils.php';

class Post {
    public static function getFeed($userId, $page = 0) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        $limit = 30;
        $offset = intval($page) * $limit;
        $userId = intval($userId);

        // Subqueries for counts to avoid N+1
        $likesSub = "SELECT COUNT(*) FROM likes WHERE post_id = feed.post_id";
        $commentsSub = "SELECT COUNT(*) FROM comments WHERE post_id = feed.post_id";
        $sharesSub = "SELECT COUNT(*) FROM posts WHERE is_share = feed.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM likes WHERE post_id = feed.post_id AND user_id = $userId";
        
        // Union Logic
        // 1. My Posts
        $myPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified
            FROM posts p
            JOIN users u ON p.post_by = u.user_id
            WHERE u.user_id = $userId
        ";

        // 2. Followed Users Posts (Fixed logic: post_by should be user2_id (the person being followed))
        $followedPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified
            FROM posts p
            JOIN follows f ON p.post_by = f.user2_id
            JOIN users u ON p.post_by = u.user_id
            WHERE p.post_public = 2 AND f.user1_id = $userId
        ";

        // 3. Friends Posts
        $friendsPosts = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified
            FROM posts p
            JOIN users u ON p.post_by = u.user_id 
            JOIN (
                SELECT user1_id AS friend_id FROM friendship WHERE user2_id = $userId AND friendship_status = 1
                UNION
                SELECT user2_id AS friend_id FROM friendship WHERE user1_id = $userId AND friendship_status = 1
            ) friends ON friends.friend_id = p.post_by
            WHERE p.post_public >= 1
        ";

        $unionSql = "$myPosts UNION $followedPosts UNION $friendsPosts";

        $sql = "
            SELECT 
                feed.*,
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.id ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared.media_hash, ''), ':', IFNULL(m_shared.media_format, '')) ORDER BY m_map_shared.id ASC SEPARATOR ',') as shared_media_list,
                
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

                (SELECT COUNT(*) FROM friendship WHERE 
                    (user1_id = $userId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $userId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM ($unionSql) as feed
            LEFT JOIN post_media_mapping m_map ON feed.post_id = m_map.post_id
            LEFT JOIN media m ON m_map.media_id = m.media_id
            LEFT JOIN media m_pfp ON feed.pfp_media_id = m_pfp.media_id
            LEFT JOIN media m_legacy ON feed.post_media = m_legacy.media_id
            
            LEFT JOIN posts shared_p ON feed.is_share = shared_p.post_id
            LEFT JOIN users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id
            
            GROUP BY feed.post_id
            ORDER BY feed.post_time DESC
            LIMIT $limit OFFSET $offset
        ";
        
        $result = $db->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public static function getProfilePosts($targetUserId, $viewerUserId, $page = 0) {
        $db = Database::getInstance();
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
            $sql = "SELECT friendship_status FROM friendship WHERE 
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
        $likesSub = "SELECT COUNT(*) FROM likes WHERE post_id = p.post_id";
        $commentsSub = "SELECT COUNT(*) FROM comments WHERE post_id = p.post_id";
        $sharesSub = "SELECT COUNT(*) FROM posts WHERE is_share = p.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM likes WHERE post_id = p.post_id AND user_id = $viewerUserId";

        $sql = "
            SELECT 
                p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                u.user_birthdate, u.user_hometown, u.user_status, u.user_about,
                
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.id ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared.media_hash, ''), ':', IFNULL(m_shared.media_format, '')) ORDER BY m_map_shared.id ASC SEPARATOR ',') as shared_media_list,
                
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

                (SELECT COUNT(*) FROM friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM posts p
            JOIN users u ON p.post_by = u.user_id
            LEFT JOIN post_media_mapping m_map ON p.post_id = m_map.post_id
            LEFT JOIN media m ON m_map.media_id = m.media_id
            LEFT JOIN media m_pfp ON u.pfp_media_id = m_pfp.media_id
            LEFT JOIN media m_legacy ON p.post_media = m_legacy.media_id
            
            LEFT JOIN posts shared_p ON p.is_share = shared_p.post_id
            LEFT JOIN users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id

            WHERE p.post_by = $targetUserId AND $privacyCondition
            GROUP BY p.post_id
            ORDER BY p.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

        return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
    
    public static function searchPosts($query, $viewerUserId, $page = 0) {
        $db = Database::getInstance();
        $limit = 30;
        $offset = intval($page) * $limit;
        $viewerUserId = intval($viewerUserId);
        $escapedQuery = $db->escape($query);
        
        // Similar permissions logic to getFeed but matching caption
        
        // Subqueries
        $likesSub = "SELECT COUNT(*) FROM likes WHERE post_id = feed.post_id";
        $commentsSub = "SELECT COUNT(*) FROM comments WHERE post_id = feed.post_id";
        $sharesSub = "SELECT COUNT(*) FROM posts WHERE is_share = feed.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM likes WHERE post_id = feed.post_id AND user_id = $viewerUserId";

        // 1. Public Posts + My Posts
        $part1 = "
             SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified
            FROM posts p
            JOIN users u ON p.post_by = u.user_id
            WHERE (p.post_public = 2 OR u.user_id = $viewerUserId) AND p.post_caption LIKE '%$escapedQuery%'
        ";
        
        // 2. Followed Users Posts (Public)
        $part2 = "
            SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified
            FROM posts p
            JOIN follows f ON p.post_by = f.user2_id
            JOIN users u ON p.post_by = u.user_id
            WHERE p.post_public = 2 AND f.user1_id = $viewerUserId AND p.post_caption LIKE '%$escapedQuery%'
        ";

        // 3. Friends Posts (Public + Friends)
        $part3 = "
             SELECT p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                   u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified
            FROM posts p
            JOIN users u ON p.post_by = u.user_id 
            JOIN (
                SELECT user1_id AS friend_id FROM friendship WHERE user2_id = $viewerUserId AND friendship_status = 1
                UNION
                SELECT user2_id AS friend_id FROM friendship WHERE user1_id = $viewerUserId AND friendship_status = 1
            ) friends ON friends.friend_id = p.post_by
            WHERE p.post_public >= 1 AND p.post_caption LIKE '%$escapedQuery%'
        ";

        $unionSql = "$part1 UNION $part2 UNION $part3";
        
        $sql = "
             SELECT 
                feed.*,
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.id ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared.media_hash, ''), ':', IFNULL(m_shared.media_format, '')) ORDER BY m_map_shared.id ASC SEPARATOR ',') as shared_media_list,
                
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

                (SELECT COUNT(*) FROM friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM ($unionSql) as feed
            LEFT JOIN post_media_mapping m_map ON feed.post_id = m_map.post_id
            LEFT JOIN media m ON m_map.media_id = m.media_id
            LEFT JOIN media m_pfp ON feed.pfp_media_id = m_pfp.media_id
            LEFT JOIN media m_legacy ON feed.post_media = m_legacy.media_id
            
            LEFT JOIN posts shared_p ON feed.is_share = shared_p.post_id
            LEFT JOIN users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id
            
            GROUP BY feed.post_id
            ORDER BY feed.post_time DESC
            LIMIT $limit OFFSET $offset
        ";

         return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
    public static function create($userId, $caption, $public, $fileData = null) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $userId = intval($userId);
        $public = intval($public);
        $timestamp = time();
        $captionClean = $db->escape($caption);
        
        $sql = "INSERT INTO posts (post_caption, post_public, post_time, post_by) VALUES ('$captionClean', '$public', $timestamp, $userId)";
        
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
        if ($hasMedia && $lastId) self::handleMediaUpload($lastId, $fileData);

        return [
            'success' => 1,
            'post_id' => $lastId
        ];
    }

    public static function share($userId, $originalPostId, $caption, $public, $fileData = null) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $userId = intval($userId);
        $originalPostId = intval($originalPostId);
        $public = intval($public);
        $timestamp = time();
        $captionClean = $db->escape($caption);
        
        $sql = "INSERT INTO posts (post_caption, post_public, post_time, post_by, is_share) VALUES ('$captionClean', '$public', $timestamp, $userId, $originalPostId)";
        
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
            // Get owner of ORIGINAL post
            $originalPostQuery = $db->query("SELECT post_by FROM posts WHERE post_id = $originalPostId");
            if ($originalPostQuery && $originalPostQuery->num_rows > 0) {
                $originalOwnerId = $originalPostQuery->fetch_assoc()['post_by'];
                if ($originalOwnerId != $userId) {
                    $notif->create($originalOwnerId, $userId, 'share', $lastId);
                }
            }

            return ['success' => 1, 'post_id' => $lastId];
        }
        
        return ['success' => 0, 'err' => 'db_error'];
    }

    private static function handleMediaUpload($postId, $fileData) {
        $db = Database::getInstance();
        $files = [];
        if (is_array($fileData['name'])) {
            $count = count($fileData['name']);
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
        
        $supported_ext = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "webm", "mp4", "mpeg"];
        
        foreach($files as $file) {
            $filename = basename($file["name"]);
            $filetype = pathinfo($filename, PATHINFO_EXTENSION);
            
            if (in_array(strtolower($filetype), $supported_ext)) {
                $mediaHash = md5_file($file["tmp_name"]);
                $mediaFormat = mime_content_type($file["tmp_name"]);
                $filePath = null;
                $uploadAllowed = false;
                
                if (exif_imagetype($file["tmp_name"])) {
                    $filePath = __DIR__ . "/../../../data/images/image/$mediaHash.bin";
                    $uploadAllowed = true;
                } elseif (function_exists('exif_videotype') && exif_videotype($file["tmp_name"])) {
                        $filePath = __DIR__ . "/../../../data/videos/video/$mediaHash.bin";
                        $uploadAllowed = true;
                }
                
                if ($uploadAllowed) {
                    $check = $db->query("SELECT media_id FROM media WHERE media_hash = '$mediaHash'");
                    $mediaId = 0;
                    if ($check->num_rows == 0) {
                        $db->query("INSERT INTO media (media_format, media_hash, media_ext) VALUES ('$mediaFormat','$mediaHash', '$filetype')");
                        $mediaId = $db->getLastId();
                    } else {
                        $mediaId = $check->fetch_assoc()["media_id"];
                    }
                    
                    if (file_exists($filePath) || move_uploaded_file($file["tmp_name"], $filePath)) {
                            // Use the index in $files array as order
                            $displayOrder = array_search($file, $files);
                            $db->query("INSERT INTO post_media_mapping (post_id, media_id, display_order) VALUES ($postId, $mediaId, $displayOrder)");
                            
                            // Legacy support: set first media as post_media
                            $db->query("UPDATE posts SET post_media = $mediaId WHERE post_id = $postId AND post_media IS NULL");
                    }
                }
            }
        }
    }

    public static function getPost($postId, $viewerUserId) {
        $db = Database::getInstance();
        $postId = intval($postId);
        $viewerUserId = intval($viewerUserId);

        // Subqueries
        $likesSub = "SELECT COUNT(*) FROM likes WHERE post_id = p.post_id";
        $commentsSub = "SELECT COUNT(*) FROM comments WHERE post_id = p.post_id";
        $sharesSub = "SELECT COUNT(*) FROM posts WHERE is_share = p.post_id";
        $isLikedSub = "SELECT COUNT(*) FROM likes WHERE post_id = p.post_id AND user_id = $viewerUserId";

        $sql = "
            SELECT 
                p.post_id, p.post_caption, p.post_time, p.post_public, p.post_by, p.post_media, p.is_share,
                u.user_firstname, u.user_lastname, u.user_id, u.user_gender, u.pfp_media_id, u.user_nickname, u.verified,
                
                ($likesSub) as total_like,
                ($commentsSub) as total_comment,
                ($sharesSub) as total_share,
                ($isLikedSub) as is_liked,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map.media_id, ':', IFNULL(m.media_hash, ''), ':', IFNULL(m.media_format, '')) ORDER BY m_map.id ASC SEPARATOR ',') as post_media_list,
                
                m_pfp.media_hash as pfp_media_hash,
                
                shared_p.post_caption as shared_caption,
                shared_p.post_time as shared_time,
                shared_p.post_public as shared_public,
                shared_p.post_media as shared_media,
                shared_p.post_by as shared_by_id,
                
                GROUP_CONCAT(DISTINCT CONCAT(m_map_shared.media_id, ':', IFNULL(m_shared.media_hash, ''), ':', IFNULL(m_shared.media_format, '')) ORDER BY m_map_shared.id ASC SEPARATOR ',') as shared_media_list,
                
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

                (SELECT COUNT(*) FROM friendship WHERE 
                    (user1_id = $viewerUserId AND user2_id = shared_p.post_by AND friendship_status = 1) OR
                    (user2_id = $viewerUserId AND user1_id = shared_p.post_by AND friendship_status = 1)
                ) as is_friend_with_shared
                
            FROM posts p
            JOIN users u ON p.post_by = u.user_id
            LEFT JOIN post_media_mapping m_map ON p.post_id = m_map.post_id
            LEFT JOIN media m ON m_map.media_id = m.media_id
            LEFT JOIN media m_pfp ON u.pfp_media_id = m_pfp.media_id
            LEFT JOIN media m_legacy ON p.post_media = m_legacy.media_id
            
            LEFT JOIN posts shared_p ON p.is_share = shared_p.post_id
            LEFT JOIN users shared_u ON shared_p.post_by = shared_u.user_id
            LEFT JOIN post_media_mapping m_map_shared ON shared_p.post_id = m_map_shared.post_id
            LEFT JOIN media m_shared ON m_map_shared.media_id = m_shared.media_id
            LEFT JOIN media m_shared_pfp ON shared_u.pfp_media_id = m_shared_pfp.media_id
            LEFT JOIN media m_shared_legacy ON shared_p.post_media = m_shared_legacy.media_id

            WHERE p.post_id = $postId
            GROUP BY p.post_id
        ";

        $res = $db->query($sql);
        if ($res->num_rows == 0) return null;
        
        $post = $res->fetch_assoc();
        
        // Visibility check
        $can_view = false;
        if ($post['post_public'] == 2) {
            $can_view = true;
        } elseif ($post['post_by'] == $viewerUserId) {
            $can_view = true;
        } elseif ($post['post_public'] == 1) {
            // Check friendship
            $checkFriend = $db->query("SELECT friendship_status FROM friendship WHERE 
                    ((user1_id = {$post['post_by']} AND user2_id = $viewerUserId) OR 
                     (user1_id = $viewerUserId AND user2_id = {$post['post_by']})) AND friendship_status = 1");
            if ($checkFriend->num_rows > 0) $can_view = true;
        }

        if (!$can_view) return null;
        
        return $post;
    }
}
