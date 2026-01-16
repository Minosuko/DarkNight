<?php
require_once __DIR__ . '/Database.php';

class Notification {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }

    /*
     * Create a notification
     * Only create if user_id != actor_id (don't notify self)
     */
    public function create($user_id, $actor_id, $type, $reference_id) {
        if ($user_id == $actor_id) {
            return false;
        }

        // Check for duplicates for 'like' to avoid spamming usage
        if ($type === 'like') {
            $checkSql = "SELECT notification_id FROM notifications 
                         WHERE user_id = ? AND actor_id = ? AND type = ? AND reference_id = ?";
            $stmt = $this->db->prepare($checkSql);
            $stmt->bind_param("iisi", $user_id, $actor_id, $type, $reference_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                return false; // Already notified
            }
        }

        $sql = "INSERT INTO notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("iisi", $user_id, $actor_id, $type, $reference_id);
        $res = $stmt->execute();
        
        // Cleanup old notifications (keep last 30)
        // We do this after insert to ensure we keep the newest + previous 29
        $this->cleanup($user_id);
        
        return $res;
    }
    
    public function cleanup($user_id) {
        // Keep only top 30
        $sql = "DELETE FROM notifications WHERE user_id = ? AND notification_id NOT IN (
            SELECT notification_id FROM (
                SELECT notification_id FROM notifications WHERE user_id = ? ORDER BY created_time DESC LIMIT 30
            ) as keep_rows
        )";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ii", $user_id, $user_id);
        return $stmt->execute();
    }

    public function getNotifications($user_id, $limit = 20, $offset = 0) {
        // Join with users table to get actor details
        $sql = "SELECT n.*, u.user_firstname, u.user_lastname, u.user_nickname, u.user_gender, 
                       u.pfp_media_id, m.media_hash as pfp_media_hash
                FROM notifications n
                JOIN users u ON n.actor_id = u.user_id
                LEFT JOIN media m ON u.pfp_media_id = m.media_id
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

    public function markAsRead($notification_id) {
        $sql = "UPDATE notifications SET is_read = 1 WHERE notification_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $notification_id);
        return $stmt->execute();
    }
    
    public function markAllAsRead($user_id) {
        $sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $user_id);
        return $stmt->execute();
    }

    public function getUnreadCount($user_id) {
        $sql = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc()['count'];
    }
}
?>
