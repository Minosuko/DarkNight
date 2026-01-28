<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Report.php';

if (!_is_session_valid()) {
    header("content-type: application/json");
    echo json_encode(['success' => 0, 'message' => 'Invalid session']);
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
header("content-type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';

if ($method === 'POST') {
    switch ($action) {
        case 'create':
            $target_type = $_POST['target_type'] ?? '';
            $target_id = intval($_POST['target_id'] ?? 0);
            $reason = $_POST['reason'] ?? '';

            if (empty($target_type) || $target_id <= 0 || empty($reason)) {
                echo json_encode(['success' => 0, 'message' => 'Missing parameters']);
                exit;
            }

            $report = new Report($conn);
            if ($report->create($user_id, $target_type, $target_id, $reason)) {
                echo json_encode(['success' => 1, 'message' => 'Report submitted successfully']);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Failed to submit report']);
            }
            break;

        default:
            echo json_encode(['success' => 0, 'message' => 'Invalid action']);
            break;
    }
}
