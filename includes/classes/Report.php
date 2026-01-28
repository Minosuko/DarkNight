<?php
class Report {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create($reporter_id, $target_type, $target_id, $reason) {
        $reporter_id = intval($reporter_id);
        $target_type = $this->db->real_escape_string($target_type);
        $target_id = intval($target_id);
        $reason = $this->db->real_escape_string($reason);
        $time = time();

        $db = Database::getInstance();
        $db_management = $db->db_management;

        $sql = "INSERT INTO $db_management.reports (reporter_id, target_type, target_id, reason, created_time) 
                VALUES ($reporter_id, '$target_type', $target_id, '$reason', $time)";
        
        return $this->db->query($sql);
    }

    public static function getById($report_id) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $report_id = intval($report_id);

        $db_management = $db->db_management;
        $db_user = $db->db_user;
        $db_media = $db->db_media;

        $sql = "SELECT r.*, 
                       u.user_nickname as reporter_name, 
                       u.user_firstname as reporter_firstname,
                       u.user_lastname as reporter_lastname,
                       u.user_gender as reporter_gender,
                       u.pfp_media_id as reporter_pfp_id,
                       m.media_hash as reporter_pfp_hash
                FROM $db_management.reports r
                JOIN $db_user.users u ON r.reporter_id = u.user_id
                LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
                WHERE r.report_id = $report_id";
        
        $result = $conn->query($sql);
        if ($result === false) return null;
        return $result->fetch_assoc();
    }

    public static function getList($page = 0, $status = 0) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $limit = 20;
        $offset = intval($page) * $limit;
        $status = intval($status);

        $db_management = $db->db_management;
        $db_user = $db->db_user;
        $db_media = $db->db_media;

        $sql = "SELECT r.*, 
                       u.user_nickname as reporter_name, 
                       u.user_firstname as reporter_firstname,
                       u.user_lastname as reporter_lastname,
                       u.user_gender as reporter_gender,
                       u.pfp_media_id as reporter_pfp_id,
                       m.media_hash as reporter_pfp_hash
                FROM $db_management.reports r
                JOIN $db_user.users u ON r.reporter_id = u.user_id
                LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
                WHERE r.status = $status
                ORDER BY r.created_time DESC LIMIT $limit OFFSET $offset";
        
        $result = $conn->query($sql);
        if ($result === false) return [];
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public static function getCount($status = null) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $db_management = $db->db_management;

        $where = "";
        if ($status !== null) {
            $status = intval($status);
            $where = "WHERE status = $status";
        }

        $sql = "SELECT COUNT(*) as count FROM $db_management.reports $where";
        $result = $conn->query($sql);
        if ($result === false) return 0;
        return intval($result->fetch_assoc()['count']);
    }

    public static function updateStatus($report_id, $status) {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        $report_id = intval($report_id);
        $status = intval($status);

        $db_management = $db->db_management;

        $sql = "UPDATE $db_management.reports SET status = $status WHERE report_id = $report_id";
        return $conn->query($sql);
    }
}
