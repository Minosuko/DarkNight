<?php
/**
 * 2FA Verification Endpoint
 * Used during login to verify TOTP code.
 */
require_once '../includes/functions.php';

header("content-type: application/json");
$ga = $GLOBALS['GoogleAuthenticator'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => 0, 'error' => 'method_not_allowed']);
    exit();
}

if (!isset($_POST['user_id']) || !isset($_POST['code'])) {
    echo json_encode(['success' => 0, 'error' => 'missing_params']);
    exit();
}

$user_id = intval($_POST['user_id']);
$code = $_POST['code'];
$db = Database::getInstance();

// Check if 2FA is enabled for user
$result = $db->query("SELECT auth_key FROM twofactorauth WHERE user_id = $user_id AND is_enabled = 1");
if ($result->num_rows === 0) {
    echo json_encode(['success' => 0, 'error' => '2fa_not_enabled']);
    exit();
}

$row = $result->fetch_assoc();
$secret = $row['auth_key'];

// Verify code using existing GoogleAuthenticator
if ($ga->verifyCode($secret, $code, 2)) {
    echo json_encode(['success' => 1, 'message' => 'verified']);
} else {
    echo json_encode(['success' => 0, 'error' => 'invalid_code']);
}
?>
