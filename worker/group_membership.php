<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit;
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

$group_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($group_id <= 0) {
    echo json_encode(['success' => 0, 'message' => 'Invalid group ID']);
    exit;
}

$group = new Group($conn);
$group_info = $group->getInfo($group_id, $user_id);

if (!$group_info) {
    echo json_encode(['success' => 0, 'message' => 'Group not found']);
    exit;
}

switch ($action) {
    case 'join':
        if ($group_info['my_status'] == 1) {
            echo json_encode(['success' => 0, 'message' => 'You are already a member']);
            break;
        }
        // Public groups: instant join. Closed: pending (implementation pending)
        $status = ($group_info['group_privacy'] == 2) ? 1 : 0;
        if ($group->addMember($group_id, $user_id, 0, $status)) {
            echo json_encode(['success' => 1, 'status' => $status, 'message' => $status == 1 ? 'Joined successfully' : 'Request sent']);
        } else {
            echo json_encode(['success' => 0, 'message' => 'Failed to process request']);
        }
        break;

    case 'leave':
        if ($group_info['my_status'] != 1) {
            echo json_encode(['success' => 0, 'message' => 'You are not a member']);
            break;
        }
        // Cannot leave if last Admin (optional check)
        $sql = "DELETE FROM group_members WHERE group_id = $group_id AND user_id = $user_id";
        if ($conn->query($sql)) {
            echo json_encode(['success' => 1, 'message' => 'Left successfully']);
        } else {
            echo json_encode(['success' => 0, 'message' => 'Failed to leave group']);
        }
        break;

    default:
        echo json_encode(['success' => 0, 'message' => 'Invalid action']);
        break;
}
?>
