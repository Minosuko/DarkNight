<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    die('{"success":0,"err":"invalid_session"}');
}

$data = _get_data_from_token();
header("content-type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_POST['id']) || !isset($_POST['password'])) {
        die('{"success":0,"err":"missing_params"}');
    }

    $groupId = intval($_POST['id']);
    $password = decryptPassword($_POST['password']);
    
    // 1. Password Verification
    if (!password_verify($password, $data['user_password'])) {
        die('{"success":0,"err":"invalid_password"}');
    }

    // 2. 2FA Verification (if enabled)
    if (Has2FA($data['user_id'])) {
        if (!isset($_POST['code'])) {
            die('{"success":0,"err":"2fa_required"}');
        }
        $code = $_POST['code'];
        if (!_verify_2FA($code, $data['user_id'])) {
            die('{"success":0,"err":"invalid_2fa"}');
        }
    }

    // 3. Permission Check (Must be Group Admin)
    $db = Database::getInstance();
    $Group = new Group($db);
    
    // Assuming backend logic to check admin. 
    // We can use isMember check or getInfo check.
    // getInfo returns My Role.
    $gInfo = $Group->getInfo($groupId, $data['user_id']);
    
    if (!$gInfo) {
         die('{"success":0,"err":"group_not_found"}');
    }
    
    // Check if user is Admin (role 2) or Creator (created_by)
    // Usually admin role (2) is enough to manage, but deletion might be strict to Creator?
    // Plan requested "Admin". Let's stick to Role 2 (Admin).
    
    if ($gInfo['my_role'] < 2) {
        die('{"success":0,"err":"unauthorized"}');
    }

    // 4. Delete Group
    if ($Group->delete($groupId, $data['user_id'])) {
        echo '{"success":1}';
    } else {
        echo '{"success":0,"err":"db_error"}';
    }
}
?>
