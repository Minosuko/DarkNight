<?php
/**
 * 2FA Status Check Endpoint
 * Returns whether 2FA is enabled for the current user.
 * Supports both TOTP (Authenticator App) and WebAuthn (Security Key)
 */
require_once '../includes/functions.php';
require_once '../includes/classes/WebAuthn.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];
$db = Database::getInstance();

// Check TOTP status
$totpResult = $db->query("SELECT is_enabled FROM twofactorauth WHERE user_id = $user_id AND is_enabled = 1");
$hasTOTP = $totpResult->num_rows > 0;

// Check Security Key status
$webauthn = new WebAuthn();
$hasSecurityKey = $webauthn->hasSecurityKeys($user_id);

// Get list of security keys for management
$securityKeys = $webauthn->getUserCredentials($user_id);

echo json_encode([
    'success' => 1,
    'enabled' => $hasTOTP || $hasSecurityKey,
    'totp_enabled' => $hasTOTP,
    'security_key_enabled' => $hasSecurityKey,
    'security_keys' => $securityKeys
]);
?>
