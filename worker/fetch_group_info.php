<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit;
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

$group_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($group_id <= 0) {
    echo json_encode(['success' => 0, 'message' => 'Invalid group ID']);
    exit;
}

$group = new Group($conn);
$info = $group->getInfo($group_id, $user_id);

if ($info) {
    // Add additional processing if needed (hash for media etc)
    if ($info['pfp_media_id'] > 0) {
        $info['pfp_media_hash'] = _get_hash_from_media_id($info['pfp_media_id']);
    }
    if ($info['cover_media_id'] > 0) {
        $info['cover_media_hash'] = _get_hash_from_media_id($info['cover_media_id']);
    }
    
    $info['success'] = 1;
    echo json_encode($info);
} else {
    echo json_encode(['success' => 0, 'message' => 'Group not found']);
}
?>
