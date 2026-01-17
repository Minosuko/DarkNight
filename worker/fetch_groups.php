<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit;
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

$sql = "SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id AND status = 1) as member_count,
        m.status as my_status
        FROM groups g
        LEFT JOIN group_members m ON m.group_id = g.group_id AND m.user_id = $user_id
        WHERE g.group_privacy >= 1 -- Only public and closed groups are discoverable
        ORDER BY member_count DESC, created_time DESC";

$query = $conn->query($sql);
$groups = [];

if ($query) {
    while ($row = $query->fetch_assoc()) {
        if ($row['pfp_media_id'] > 0) {
            $row['pfp_media_hash'] = _get_hash_from_media_id($row['pfp_media_id']);
        }
        if ($row['cover_media_id'] > 0) {
            $row['cover_media_hash'] = _get_hash_from_media_id($row['cover_media_id']);
        }
        $groups[] = $row;
    }
}

echo json_encode($groups);
?>
