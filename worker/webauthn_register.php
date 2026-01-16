<?php
session_start();
/**
 * WebAuthn Registration Endpoint
 * GET: Get registration options
 * POST: Verify and store credential
 */
require_once '../includes/functions.php';
require_once '../includes/classes/WebAuthn.php';

if (!_is_session_valid()) {
    header("Content-Type: application/json");
    echo json_encode(['success' => 0, 'error' => 'Not logged in']);
    exit();
}

header("Content-Type: application/json");
$data = _get_data_from_token();
$userId = $data['user_id'];
$db = Database::getInstance();

// Get user info
$userInfo = $db->query("SELECT user_email, user_nickname, user_firstname, user_lastname FROM users WHERE user_id = $userId")->fetch_assoc();

$webauthn = new WebAuthn();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userName = $userInfo['user_nickname'] ?: $userInfo['user_email'];
    $displayName = trim($userInfo['user_firstname'] . ' ' . $userInfo['user_lastname']) ?: $userName;
    
    $options = $webauthn->getRegistrationOptions($userId, $userName, $displayName);
    echo json_encode(['success' => 1, 'options' => $options]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['response'])) {
        echo json_encode(['success' => 0, 'error' => 'Invalid request']);
        exit();
    }
    
    $result = $webauthn->verifyRegistration($input['response']);
    
    if ($result['success']) {
        echo json_encode(['success' => 1, 'message' => 'Security key registered successfully']);
    } else {
        echo json_encode(['success' => 0, 'error' => $result['error']]);
    }
}
