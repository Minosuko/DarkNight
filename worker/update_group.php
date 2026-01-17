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
    $group_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $group_name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $group_about = isset($_POST['about']) ? trim($_POST['about']) : '';
    $group_rules = isset($_POST['rules']) ? trim($_POST['rules']) : '';
    $group_privacy = isset($_POST['privacy']) ? (int)$_POST['privacy'] : 2;

    if ($group_id <= 0) {
        echo json_encode(['success' => 0, 'message' => 'Invalid group ID']);
        exit;
    }

    if (empty($group_name)) {
        echo json_encode(['success' => 0, 'message' => 'Group name is required']);
        exit;
    }

    $group = new Group($conn);
    
    // Check if user is admin
    $info = $group->getInfo($group_id, $user_id);
    if (!$info || $info['my_role'] < 2) {
        echo json_encode(['success' => 0, 'message' => 'You do not have permission to edit this group']);
        exit;
    }

    if ($group->update($group_id, $group_name, $group_about, $group_privacy, $group_rules)) {
        echo json_encode(['success' => 1, 'message' => 'Group updated successfully']);
    } else {
        echo json_encode(['success' => 0, 'message' => 'Failed to update group']);
    }
} else {
    echo json_encode(['success' => 0, 'message' => 'Invalid request method']);
}
?>
