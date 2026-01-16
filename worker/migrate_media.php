<?php
require_once __DIR__ . '/../includes/classes/Database.php';

$db = Database::getInstance();
$conn = $db->getConnection();

echo "Starting migration...\n";

// 1. Create Table
$sql = "CREATE TABLE IF NOT EXISTS post_media_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    media_id INT NOT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media(media_id) ON DELETE CASCADE
)";

if ($db->query($sql)) {
    echo "Table 'post_media_mapping' created or exists.\n";
} else {
    die("Error creating table: " . $conn->error . "\n");
}

// 2. Migrate existing data
// Only insert if not exists to avoid duplicates on re-run
$migrationSql = "INSERT INTO post_media_mapping (post_id, media_id, display_order)
                 SELECT post_id, post_media, 0 
                 FROM posts 
                 WHERE post_media IS NOT NULL AND post_media > 0 
                 AND post_id NOT IN (SELECT post_id FROM post_media_mapping)";

if ($db->query($migrationSql)) {
    echo "Migrated existing media data.\n";
} else {
    die("Error migrating data: " . $conn->error . "\n");
}

echo "Migration complete.\n";
?>
