<?php
require_once __DIR__ . '/Database.php';

class User {
    public static function exists($id) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("SELECT user_id FROM $db_user.users WHERE user_id = %d", $db->escape($id));
        $result = $db->query($sql);
        return $result->num_rows > 0;
    }

    public static function usernameExists($username) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("SELECT user_nickname FROM $db_user.users WHERE user_nickname LIKE '%s'", $db->escape($username));
        $result = $db->query($sql);
        return $result->num_rows > 0;
    }

    public static function emailExists($email) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("SELECT user_email FROM $db_user.users WHERE user_email LIKE '%s'", $db->escape($email));
        $result = $db->query($sql);
        return $result->num_rows > 0;
    }

    public static function checkActive($id) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf(
            "SELECT user_id FROM $db_user.users WHERE user_id = %d AND active = 1",
            $db->escape($id)
        );
        $query = $db->query($sql);
        return ($query->num_rows == 1);
    }

    public static function getDataById($id) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf(
            "SELECT * FROM $db_user.users WHERE user_id = %d",
            $db->escape($id)
        );
        $query = $db->query($sql);
        return $query->fetch_assoc();
    }
    
    public static function verify($username, $email, $hash) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf(
            "SELECT * FROM $db_user.users WHERE user_nickname LIKE '%s' AND user_email LIKE '%s' AND active = 0",
            $db->escape($username),
            $db->escape($email)
        );
        $query = $db->query($sql);
        if ($query->num_rows > 0) {
            $fetch = $query->fetch_assoc();
            // Use user_create_date as salt since user_token is removed
            if (hash('sha256', ($fetch['user_password'] . $fetch['user_create_date'])) == $hash) {
                $updateSql = sprintf(
                    "UPDATE $db_user.users SET active = 1 WHERE user_nickname LIKE '%s' AND user_email LIKE '%s'",
                    $db->escape($username),
                    $db->escape($email)
                );
                $db->query($updateSql);
                return true;
            }
        }
        return false;
    }

    public static function findByLogin($login) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf(
            "SELECT * FROM $db_user.users WHERE user_email LIKE '%s' OR user_nickname LIKE '%s'",
            $db->escape($login),
            $db->escape($login)
        );
        $result = $db->query($sql);
        if ($result->num_rows == 1) {
            return $result->fetch_assoc();
        }
        return null;
    }

    public static function create($firstname, $lastname, $nickname, $password, $email, $gender, $birthdate, $about, $create_date) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf(
            "INSERT INTO $db_user.users(user_firstname, user_lastname, user_nickname, user_password, user_email, user_gender, user_birthdate, user_about, user_create_date) VALUES ('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', %d)",
            $db->escape($firstname),
            $db->escape($lastname),
            $db->escape($nickname),
            $db->escape($password),
            $db->escape($email),
            $db->escape($gender),
            $db->escape($birthdate),
            $db->escape($about),
            $create_date
        );
        return $db->query($sql);
    }

    public static function findByNicknameOrEmail($nickname, $email) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf(
            "SELECT user_nickname, user_email FROM $db_user.users WHERE user_nickname LIKE '%s' OR user_email LIKE '%s'",
            $db->escape($nickname),
            $db->escape($email)
        );
        $result = $db->query($sql);
        return $result->fetch_assoc();
    }

    public static function ban($id) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("UPDATE $db_user.users SET is_banned = 1 WHERE user_id = %d", $db->escape($id));
        return $db->query($sql);
    }

    public static function unban($id) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("UPDATE $db_user.users SET is_banned = 0 WHERE user_id = %d", $db->escape($id));
        return $db->query($sql);
    }

    public static function isBanned($id) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("SELECT is_banned FROM $db_user.users WHERE user_id = %d", $db->escape($id));
        $result = $db->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            return (intval($row['is_banned']) === 1);
        }
        return false;
    }

    public static function updateVerifiedBadge($id, $level) {
        $db = Database::getInstance();
        $db_user = $db->db_user;
        $sql = sprintf("UPDATE $db_user.users SET verified = %d WHERE user_id = %d", intval($level), $db->escape($id));
        return $db->query($sql);
    }
}
