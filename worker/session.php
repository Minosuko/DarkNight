<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();
$current_browser_id = $_COOKIE['browser_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List sessions
    $conn = $GLOBALS['conn'];
    $user_id = $data['user_id'];
    
    // Clean up old sessions first (optional, maybe older than 30 days)
    // $conn->query("DELETE FROM session WHERE user_id = $user_id AND last_online < " . (time() - 86400*30));
    
    $sql = "SELECT * FROM session WHERE user_id = $user_id ORDER BY last_online DESC";
    $result = $conn->query($sql);
    
    $sessions = [];
    while($row = $result->fetch_assoc()) {
        $is_current = ($row['browser_id'] === $current_browser_id);
        
        // Format last active time
        $time_diff = time() - $row['last_online'];
        if ($time_diff < 60) $active_str = "Just now";
        elseif ($time_diff < 3600) $active_str = floor($time_diff/60) . "m ago";
        elseif ($time_diff < 86400) $active_str = floor($time_diff/3600) . "h ago";
        else $active_str = floor($time_diff/86400) . "d ago";
        
        $sessions[] = [
            'session_id' => $row['session_id'],
            'os' => $row['session_os'] ?: 'Unknown OS',
            'browser' => $row['session_browser'] ?: 'Unknown Browser',
            'ip' => $row['session_ip'],
            'last_active' => $active_str,
            'is_current' => $is_current,
            'device_str' => $row['session_device'] // Full UA for debug or tooltip
        ];
    }
    
    echo json_encode(['success' => 1, 'sessions' => $sessions]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Revoke session
    if (isset($_POST['revoke_all'])) {
        $conn = $GLOBALS['conn'];
        $user_id = $data['user_id'];
        $current_browser_id = $conn->real_escape_string($_COOKIE['browser_id']);
        
        // Delete all sessions EXCEPT current one (by browser_id linkage or session_id from cookie)
        // We have session_id in $data if we want to be precise, or use browser_id.
        // Let's use current browser_id to exclude.
        $sql = "DELETE FROM session WHERE user_id = $user_id AND browser_id != '$current_browser_id'";
        
        if($conn->query($sql)){
             echo json_encode(['success' => 1]);
        } else {
             echo json_encode(['success' => 0, 'error' => 'db_error']);
        }
        exit();
    }

    if (!isset($_POST['session_id'])) {
        die(json_encode(['success' => 0, 'error' => 'missing_id']));
    }
    
    $session_id = $conn->real_escape_string($_POST['session_id']);
    
    // Verify ownership
    $conn = $GLOBALS['conn'];
    $user_id = $data['user_id'];
    
    $sql = "DELETE FROM session WHERE session_id = '$session_id' AND user_id = $user_id";
    $conn->query($sql);
    
    if ($conn->affected_rows > 0) {
        echo json_encode(['success' => 1]);
    } else {
        echo json_encode(['success' => 0, 'error' => 'invalid_session']);
    }
}
?>
