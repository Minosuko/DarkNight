<?php
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/classes/Notification.php';

header('Content-Type: application/json');

if (!_is_session_valid()) {
    echo json_encode(['success' => 0, 'message' => 'Not logged in']);
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
$notification = new Notification();

// Default action: fetch list
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

if (isset($_GET['action'])) {
    if ($_GET['action'] == 'count') {
        $count = $notification->getUnreadCount($user_id);
        echo json_encode(['success' => 1, 'count' => $count]);
        exit();
    }
    if ($_GET['action'] == 'read_all') {
        $notification->markAllAsRead($user_id);
        echo json_encode(['success' => 1]);
        exit();
    }
}

$notifications = $notification->getNotifications($user_id, $limit, $offset);

echo json_encode([
    'success' => 1, 
    'notifications' => $notifications
]);
?>
