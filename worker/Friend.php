<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Friend.php';

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

if ($method === 'GET') {
    switch ($action) {
        case 'get_friends':
            $page = isset($_GET['page']) ? intval($_GET['page']) : 0;
            $friends = Friend::getList($user_id, $page);
            echo json_encode(['success' => 1, 'friends' => $friends]);
            break;
            
        case 'get_requests':
             $page = isset($_GET['page']) ? intval($_GET['page']) : 0;
             $requests = Friend::getRequests($user_id, $page);
             echo json_encode(['success' => 1, 'requests' => $requests]);
             break;
             
        default:
             echo json_encode(['success' => 0, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => 0, 'message' => 'Invalid method']);
}
