<?php
require_once __DIR__ . '/Database.php';

class Notification {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create($user_id, $actor_id, $type, $related_id = 0) {
        $db_user = $this->db->db_user;
        $time = time();
        $sql = "INSERT INTO $db_user.notifications (user_id, actor_id, type, related_id, created_time) 
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("iisii", $user_id, $actor_id, $type, $related_id, $time);
        return $stmt->execute();
    }

    public function markAsRead($notification_id, $user_id) {
        $db_user = $this->db->db_user;
        $sql = "UPDATE $db_user.notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ii", $notification_id, $user_id);
        return $stmt->execute();
    }

    public function markAllAsRead($user_id) {
        $db_user = $this->db->db_user;
        $sql = "UPDATE $db_user.notifications SET is_read = 1 WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $user_id);
        return $stmt->execute();
    }

    public function delete($notification_id, $user_id) {
        $db_user = $this->db->db_user;
        $sql = "DELETE FROM $db_user.notifications WHERE notification_id = ? AND user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ii", $notification_id, $user_id);
        return $stmt->execute();
    }

    public function getUnreadCount($user_id) {
        $db_user = $this->db->db_user;
        $sql = "SELECT COUNT(*) as count FROM $db_user.notifications WHERE user_id = ? AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc()['count'];
    }

    public function getNotifications($user_id, $limit = 20, $offset = 0) {
        $db_user = $this->db->db_user;
        $db_media = $this->db->db_media;
        
        // Join with users table to get actor details
        $sql = "SELECT n.*, u.user_firstname, u.user_lastname, u.user_nickname, u.user_gender, 
                       u.pfp_media_id, m.media_hash as pfp_media_hash
                FROM $db_user.notifications n
                JOIN $db_user.users u ON n.actor_id = u.user_id
                LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
                WHERE n.user_id = ?
                ORDER BY n.created_time DESC
                LIMIT ? OFFSET ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("iii", $user_id, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = $row;
        }
        return $notifications;
    }
}
