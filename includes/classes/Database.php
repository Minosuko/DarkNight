<?php
class Database {
    private static $instance = null;
    private $conn;
    public $db_user;
    public $db_post;
    public $db_media;
    public $db_management;

    private function __construct() {
        // Assuming this file is in includes/classes/
        $configPath = __DIR__ . '/../config/database.php';
        if (file_exists($configPath)) {
            require $configPath;
            // $host, $username, $dbpassword, $db_user, $db_post, $db_media are defined in database.php
            $this->db_user = $db_user;
            $this->db_post = $db_post;
            $this->db_media = $db_media;
            $this->db_management = $db_management;
            
            // Connect to user database by default
            $this->conn = new mysqli($host, $username, $dbpassword, $db_user);

            if ($this->conn->connect_error) {
                die("Connection failed: " . $this->conn->connect_error);
            }

            $this->conn->query("SET character_set_results='utf8mb4'");
            $this->conn->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_bin'");
            $this->conn->set_charset('utf8mb4');
        } else {
            die("Database configuration not found.");
        }
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }

    public function query($sql) {
        return $this->conn->query($sql);
    }

    public function prepare($sql) {
        return $this->conn->prepare($sql);
    }

    public function escape($string) {
        return $this->conn->real_escape_string($string);
    }
    
    public function getLastId() {
        return $this->conn->insert_id;
    }
}
?>
