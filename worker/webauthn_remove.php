<?php
/**
 * WebAuthn Remove Credential Endpoint
 */
require_once '../includes/functions.php';
require_once '../includes/classes/WebAuthn.php';

if (!_is_session_valid()) {
    header("Content-Type: application/json");
    echo json_encode(['success' => 0, 'error' => 'Not logged in']);
    exit();
}

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => 0, 'error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['credential_id'])) {
    echo json_encode(['success' => 0, 'error' => 'Missing credential ID']);
    exit();
}

$data = _get_data_from_token();
$userId = $data['user_id'];
$credentialId = $input['credential_id'];

$webauthn = new WebAuthn();
if ($webauthn->removeCredential($userId, $credentialId)) {
    echo json_encode(['success' => 1, 'message' => 'Credential removed']);
} else {
    echo json_encode(['success' => 0, 'error' => 'Failed to remove credential']);
}
?>
