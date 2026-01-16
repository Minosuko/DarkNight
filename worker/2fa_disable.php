<?php
/**
 * 2FA Disable Endpoint
 * Requires password and current 2FA code to disable.
 */
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$ga = $GLOBALS['GoogleAuthenticator'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => 0, 'error' => 'method_not_allowed']);
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
$db = Database::getInstance();

if (!isset($_POST['password']) || !isset($_POST['code'])) {
    echo json_encode(['success' => 0, 'error' => 'missing_params']);
    exit();
}

$password = $_POST['password'];
$code = $_POST['code'];

// Verify password
$userResult = $db->query("SELECT user_password FROM users WHERE user_id = $user_id");
if ($userResult->num_rows === 0) {
    echo json_encode(['success' => 0, 'error' => 'user_not_found']);
    exit();
}

$userRow = $userResult->fetch_assoc();
if (!password_verify($password, $userRow['user_password'])) {
    echo json_encode(['success' => 0, 'error' => 'invalid_password']);
    exit();
}

// Get 2FA secret
$result = $db->query("SELECT auth_key FROM twofactorauth WHERE user_id = $user_id AND is_enabled = 1");
if ($result->num_rows === 0) {
    echo json_encode(['success' => 0, 'error' => '2fa_not_enabled']);
    exit();
}

$row = $result->fetch_assoc();
$secret = $row['auth_key'];

// Verify 2FA code using existing GoogleAuthenticator
if (!$ga->verifyCode($secret, $code, 2)) {
    echo json_encode(['success' => 0, 'error' => 'invalid_2fa_code']);
    exit();
}

// Disable 2FA
$db->query("DELETE FROM twofactorauth WHERE user_id = $user_id");
echo json_encode(['success' => 1, 'message' => '2fa_disabled']);
?>
