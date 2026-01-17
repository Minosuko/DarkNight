<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit;
}

header("content-type: application/json");

$group_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($group_id <= 0) {
    echo json_encode([]);
    exit;
}

// Security: check if user can view members (for secret groups)
$group = new Group($conn);
$user_data = _get_data_from_token();
$user_id = $user_data['user_id'];

$group_info = $group->getInfo($group_id, $user_id);
if (!$group_info) {
    echo json_encode([]);
    exit;
}

if ($group_info['group_privacy'] == 0 && $group_info['my_status'] != 1) {
    echo json_encode([]);
    exit;
}

$query_term = isset($_GET['query']) ? $conn->real_escape_string($_GET['query']) : '';
$searchCond = "";
if ($query_term !== '') {
    $searchCond = " AND (u.user_firstname LIKE '%$query_term%' OR u.user_lastname LIKE '%$query_term%' OR u.user_nickname LIKE '%$query_term%')";
}

$sql = "SELECT m.user_id, m.role, m.status, 
               u.user_firstname, u.user_lastname, u.user_nickname, u.pfp_media_id, u.verified
        FROM group_members m
        JOIN users u ON m.user_id = u.user_id
        WHERE m.group_id = $group_id AND m.status = 1 $searchCond
        ORDER BY m.role DESC, m.joined_time ASC";

$query = $conn->query($sql);
$members = [];

if ($query) {
    while ($row = $query->fetch_assoc()) {
        if ($row['pfp_media_id'] > 0) {
            $row['pfp_media_hash'] = _get_hash_from_media_id($row['pfp_media_id']);
        }
        $members[] = $row;
    }
}

echo json_encode($members);
?>
