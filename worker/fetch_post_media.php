<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("content-type: application/json");
    echo '{"success":0,"error":"Not logged in"}';
    exit();
}

header("content-type: application/json");

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo '{"success":0,"error":"Invalid post ID"}';
    exit();
}

$post_id = intval($_GET['id']);
$data = _get_data_from_token();
$viewer_id = $data['user_id'];

$db = Database::getInstance();

// Get post info to check permissions
$sql = "SELECT post_by, post_public FROM posts WHERE post_id = $post_id";
$result = $db->query($sql);

if ($result->num_rows == 0) {
    echo '{"success":0,"error":"Post not found"}';
    exit();
}

$post = $result->fetch_assoc();
$post_by = $post['post_by'];
$post_public = $post['post_public'];

// Check permissions
$canView = false;
if ($post_by == $viewer_id) {
    $canView = true;
} elseif ($post_public == 2) {
    $canView = true;
} elseif ($post_public == 1) {
    // Check if friends
    $sql = "SELECT friendship_status FROM friendship WHERE 
            ((user1_id = $post_by AND user2_id = $viewer_id) OR 
             (user1_id = $viewer_id AND user2_id = $post_by)) 
            AND friendship_status = 1";
    $friendCheck = $db->query($sql);
    if ($friendCheck->num_rows > 0) {
        $canView = true;
    }
}

if (!$canView) {
    echo '{"success":0,"error":"Access denied"}';
    exit();
}

// Get all media for this post
$sql = "SELECT m.media_id, m.media_hash, m.media_format
        FROM post_media_mapping pm
        JOIN media m ON pm.media_id = m.media_id
        WHERE pm.post_id = $post_id
        ORDER BY pm.display_order ASC";

$result = $db->query($sql);
$media = [];

while ($row = $result->fetch_assoc()) {
    $media[] = [
        'media_id' => $row['media_id'],
        'media_hash' => $row['media_hash'],
        'media_format' => $row['media_format']
    ];
}

echo json_encode(['success' => 1, 'media' => $media]);
?>
