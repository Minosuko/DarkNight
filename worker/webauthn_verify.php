<?php
session_start();
/**
 * WebAuthn Authentication Endpoint
 * GET: Get authentication options
 * POST: Verify assertion
 */
require_once '../includes/functions.php';
require_once '../includes/classes/WebAuthn.php';

header("Content-Type: application/json");

$webauthn = new WebAuthn();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // For login flow, we might not have a user yet, or we might
    $userId = null;
    if (_is_session_valid(false)) {
        $data = _get_data_from_token();
        $userId = $data['user_id'];
    }
    
    // Check if specific user requested via query
    if (isset($_GET['user_id'])) {
        $userId = (int)$_GET['user_id'];
    }
    
    $options = $webauthn->getAuthenticationOptions($userId);
    echo json_encode(['success' => 1, 'options' => $options]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['response'])) {
        echo json_encode(['success' => 0, 'error' => 'Invalid request']);
        exit();
    }
    
    $result = $webauthn->verifyAuthentication($input['response']);
    
    if ($result['success']) {
        // Mark 2FA as verified for this session (JWT upgrade + DB update)
        _upgrade_session_2fa($result['user_id']);
        
        // Also mark in PHP session for good measure
        $_SESSION['2fa_verified'] = true;
        $_SESSION['2fa_verified_at'] = time();
        
        echo json_encode([
            'success' => 1, 
            'message' => 'Authentication successful',
            'redirect' => 'home.php'
        ]);
    } else {
        echo json_encode(['success' => 0, 'error' => $result['error']]);
    }
}
