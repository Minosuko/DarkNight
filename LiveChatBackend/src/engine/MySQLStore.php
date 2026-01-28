<?php

namespace LiveChat\Engine;

class MySQLStore {
    private $conn;
    private $db_user;

    public function __construct($host, $user, $pass, $db_user) {
        $this->db_user = $db_user;
        $this->conn = new \mysqli($host, $user, $pass, $db_user);

        if ($this->conn->connect_error) {
            throw new \Exception("MySQL Connection failed: " . $this->conn->connect_error);
        }

        $this->conn->set_charset('utf8mb4');
    }

    public function getUserInfo($nickname) {
        $sql = sprintf(
            "SELECT u.user_id, u.user_firstname, u.user_lastname, u.user_nickname, u.pfp_media_id, u.user_gender, u.verified, m.media_hash as pfp_media_hash 
             FROM %s.users u 
             LEFT JOIN fds_media.media m ON u.pfp_media_id = m.media_id
             WHERE u.user_nickname = '%s' LIMIT 1",
            $this->db_user,
            $this->conn->real_escape_string($nickname)
        );

        $result = $this->conn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            return $row;
        }
        return null;
    }

    public function getInfoById($userId) {
        $sql = sprintf(
            "SELECT u.user_id, u.user_firstname, u.user_lastname, u.user_nickname, u.pfp_media_id, u.user_gender, u.verified, m.media_hash as pfp_media_hash 
             FROM %s.users u 
             LEFT JOIN fds_media.media m ON u.pfp_media_id = m.media_id
             WHERE u.user_id = %d LIMIT 1",
            $this->db_user,
            (int)$userId
        );

        $result = $this->conn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            return $row;
        }
        return null;
    }
}
