<?php
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        // Assuming this file is in includes/classes/
        $configPath = __DIR__ . '/../config/database.php';
        if (file_exists($configPath)) {
            require $configPath;
            // $host, $username, $dbpassword, $dbdatabase are defined in database.php
            $this->conn = new mysqli($host, $username, $dbpassword, $dbdatabase);

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
