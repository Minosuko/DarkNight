<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Notification.php';

if (!_is_session_valid()) {
    header("content-type: application/json");
    echo json_encode(['success' => 0, 'message' => 'Not logged in']);
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
header("content-type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? 'list'; // Default to list if not specified

if ($method === 'GET' || $method === 'POST') {
    $notification = new Notification();
    
    switch ($action) {
        case 'list':
            $limit = isset($_REQUEST['limit']) ? (int)$_REQUEST['limit'] : 30;
            $offset = isset($_REQUEST['offset']) ? (int)$_REQUEST['offset'] : 0;
            $filter = $_REQUEST['filter'] ?? 'all'; // all, unread
            
            $notifications = $notification->getNotifications($user_id, $limit, $offset);
            
            // Filter unread if requested
            if ($filter === 'unread') {
                $notifications = array_filter($notifications, function($n) {
                    return $n['is_read'] == 0;
                });
                $notifications = array_values($notifications);
            }
            
            echo json_encode([
                'success' => 1, 
                'notifications' => $notifications,
                'unread_count' => $notification->getUnreadCount($user_id)
            ]);
            break;
            
        case 'count':
            $count = $notification->getUnreadCount($user_id);
            echo json_encode(['success' => 1, 'count' => $count]);
            break;
            
        case 'read_all':
            $notification->markAllAsRead($user_id);
            echo json_encode(['success' => 1]);
            break;
        
        case 'read_single':
            $notification_id = intval($_REQUEST['notification_id'] ?? 0);
            if ($notification_id > 0) {
                $notification->markAsRead($notification_id, $user_id);
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Invalid notification ID']);
            }
            break;
            
        case 'delete':
            $notification_id = intval($_REQUEST['notification_id'] ?? 0);
            if ($notification_id > 0) {
                $notification->delete($notification_id, $user_id);
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Invalid notification ID']);
            }
            break;
            
        default:
             echo json_encode(['success' => 0, 'message' => 'Invalid action']);
             break;
    }
}
?>
