<?php
/**
 * 2FA Setup Endpoint
 * GET: Generate new secret and return QR code
 * POST: Verify code and enable 2FA
 */
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];
$db = Database::getInstance();
$ga = $GLOBALS['GoogleAuthenticator'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Generate new secret using existing GoogleAuthenticator
    $secret = $ga->createSecret(16);
    
    // Get user info for label
    $userInfo = $db->query("SELECT user_email, user_nickname FROM users WHERE user_id = $user_id")->fetch_assoc();
    $label = $userInfo['user_nickname'] ?: $userInfo['user_email'];
    
    // Generate QR code URL using existing method (external API)
    // Or use our new QRCode class for local generation
    $qrUrl = $ga->getQRCodeGoogleUrl($label, $secret, 'Darknight Social');
    
    // Also generate local QR using our QRCode class
    $otpAuthUrl = 'otpauth://totp/' . rawurlencode('Darknight Social:' . $label) . '?secret=' . $secret . '&issuer=' . rawurlencode('Darknight Social');
    $qrDataUri = QRCode::getDataUri($otpAuthUrl, 5);
    
    // Store secret temporarily in database
    $escapedSecret = $db->escape($secret);
    $db->query("DELETE FROM twofactorauth WHERE user_id = $user_id AND is_enabled = 0");
    $db->query("INSERT INTO twofactorauth (auth_key, user_id, is_enabled) VALUES ('$escapedSecret', $user_id, 0)");
    
    echo json_encode([
        'success' => 1,
        'secret' => $secret,
        'qr' => $qrDataUri,
        'qr_url' => $qrUrl
    ]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verify code and enable 2FA
    if (!isset($_POST['code'])) {
        echo json_encode(['success' => 0, 'error' => 'missing_code']);
        exit();
    }
    
    $code = $_POST['code'];
    
    // Get pending secret
    $result = $db->query("SELECT auth_key FROM twofactorauth WHERE user_id = $user_id ORDER BY is_enabled ASC LIMIT 1");
    if ($result->num_rows === 0) {
        echo json_encode(['success' => 0, 'error' => 'no_pending_setup']);
        exit();
    }
    
    $row = $result->fetch_assoc();
    $secret = $row['auth_key'];
    
    // Verify code using existing GoogleAuthenticator
    if ($ga->verifyCode($secret, $code, 2)) {
        // Enable 2FA
        $db->query("UPDATE twofactorauth SET is_enabled = 1 WHERE user_id = $user_id AND auth_key = '$secret'");
        echo json_encode(['success' => 1, 'message' => '2fa_enabled']);
    } else {
        echo json_encode(['success' => 0, 'error' => 'invalid_code']);
    }
}
?>
