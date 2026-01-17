<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit;
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $group_name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $group_about = isset($_POST['about']) ? trim($_POST['about']) : '';
    $group_privacy = isset($_POST['privacy']) ? (int)$_POST['privacy'] : 2;

    if (empty($group_name)) {
        echo json_encode(['success' => 0, 'message' => 'Group name is required']);
        exit;
    }

    $group = new Group($conn);
    $group_id = $group->create($group_name, $group_about, $group_privacy, $user_id);

    if ($group_id) {
        echo json_encode(['success' => 1, 'group_id' => $group_id, 'message' => 'Group created successfully']);
    } else {
        echo json_encode(['success' => 0, 'message' => 'Failed to create group']);
    }
} else {
    echo json_encode(['success' => 0, 'message' => 'Invalid request method']);
}
?>
