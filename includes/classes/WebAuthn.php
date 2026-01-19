<?php
/**
 * WebAuthn Helper Class
 * Implements FIDO2/WebAuthn for Security Key 2FA
 * 
 * Supports:
 * - Credential registration (navigator.credentials.create)
 * - Credential authentication (navigator.credentials.get)
 */
class WebAuthn {
    private $rpId;      // Relying Party ID (domain)
    private $rpName;    // Relying Party Name
    private $db;
    
    public function __construct($rpId = null, $rpName = 'Darknight Social') {
        $this->rpId = $rpId ?: $_SERVER['HTTP_HOST'];
        // Remove port if present
        if (strpos($this->rpId, ':') !== false) {
            $this->rpId = explode(':', $this->rpId)[0];
        }
        $this->rpName = $rpName;
        $this->db = Database::getInstance();
    }
    
    /**
     * Generate registration options for navigator.credentials.create()
     */
    public function getRegistrationOptions($userId, $userName, $userDisplayName) {
        // Generate challenge
        $challenge = $this->generateChallenge();
        
        // Store challenge in session
        $_SESSION['webauthn_challenge'] = $challenge;
        $_SESSION['webauthn_user_id'] = $userId;
        
        // Get existing credentials to exclude
        $excludeCredentials = [];
        $db_user = $this->db->db_user;
        $result = $this->db->query("SELECT credential_id FROM $db_user.webauthn_credentials WHERE user_id = $userId");
        while ($row = $result->fetch_assoc()) {
            $excludeCredentials[] = [
                'type' => 'public-key',
                'id' => $row['credential_id']
            ];
        }
        
        return [
            'challenge' => $this->base64UrlEncode($challenge),
            'rp' => [
                'name' => $this->rpName,
                'id' => $this->rpId
            ],
            'user' => [
                'id' => $this->base64UrlEncode(hash('sha256', $userId, true)),
                'name' => $userName,
                'displayName' => $userDisplayName
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7],   // ES256
                ['type' => 'public-key', 'alg' => -257] // RS256
            ],
            'timeout' => 60000,
            'attestation' => 'none',
            'authenticatorSelection' => [
                'authenticatorAttachment' => 'cross-platform',
                'userVerification' => 'discouraged',
                'residentKey' => 'discouraged'
            ],
            'excludeCredentials' => $excludeCredentials
        ];
    }
    
    /**
     * Verify and store registration response
     */
    public function verifyRegistration($response) {
        if (!isset($_SESSION['webauthn_challenge']) || !isset($_SESSION['webauthn_user_id'])) {
            return ['success' => false, 'error' => 'No pending registration'];
        }
        
        $challenge = $_SESSION['webauthn_challenge'];
        $userId = $_SESSION['webauthn_user_id'];
        
        // Clear session
        unset($_SESSION['webauthn_challenge']);
        unset($_SESSION['webauthn_user_id']);
        
        // Parse client data
        $clientDataJSON = $this->base64UrlDecode($response['clientDataJSON']);
        $clientData = json_decode($clientDataJSON, true);
        
        // Verify challenge
        $receivedChallenge = $this->base64UrlDecode($clientData['challenge']);
        if (!hash_equals($challenge, $receivedChallenge)) {
            return ['success' => false, 'error' => 'Challenge mismatch'];
        }
        
        // Verify origin
        $expectedOrigin = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        if ($clientData['origin'] !== $expectedOrigin) {
            return ['success' => false, 'error' => 'Origin mismatch'];
        }
        
        // Parse attestation object
        $attestationObject = $this->base64UrlDecode($response['attestationObject']);
        $attestation = $this->parseCBOR($attestationObject);
        
        if (!$attestation || !isset($attestation['authData'])) {
            return ['success' => false, 'error' => 'Invalid attestation'];
        }
        
        // Parse authenticator data
        $authData = $attestation['authData'];
        $rpIdHash = substr($authData, 0, 32);
        $flags = ord($authData[32]);
        $signCount = unpack('N', substr($authData, 33, 4))[1];
        
        // Check user present flag
        if (!($flags & 0x01)) {
            return ['success' => false, 'error' => 'User not present'];
        }
        
        // Check attested credential data flag
        if (!($flags & 0x40)) {
            return ['success' => false, 'error' => 'No credential data'];
        }
        
        // Extract credential ID and public key
        $offset = 37;
        $aaguid = substr($authData, $offset, 16);
        $offset += 16;
        $credIdLen = unpack('n', substr($authData, $offset, 2))[1];
        $offset += 2;
        $credentialId = substr($authData, $offset, $credIdLen);
        $offset += $credIdLen;
        $publicKeyBytes = substr($authData, $offset);
        
        // Store credential
        $credIdB64 = $this->base64UrlEncode($credentialId);
        $pubKeyB64 = base64_encode($publicKeyBytes);
        $escapedCredId = $this->db->escape($credIdB64);
        $escapedPubKey = $this->db->escape($pubKeyB64);
        $name = isset($response['name']) ? $this->db->escape($response['name']) : 'Security Key';
        $db_user = $this->db->db_user;
        
        $sql = "INSERT INTO $db_user.webauthn_credentials (user_id, credential_id, public_key, counter, name) 
                VALUES ($userId, '$escapedCredId', '$escapedPubKey', $signCount, '$name')";
        
        if ($this->db->query($sql)) {
            return ['success' => true, 'message' => 'Security key registered'];
        } else {
            return ['success' => false, 'error' => 'Database error'];
        }
    }
    
    /**
     * Generate authentication options for navigator.credentials.get()
     */
    public function getAuthenticationOptions($userId = null) {
        $challenge = $this->generateChallenge();
        $_SESSION['webauthn_auth_challenge'] = $challenge;
        
        $allowCredentials = [];
        if ($userId) {
            $_SESSION['webauthn_auth_user_id'] = $userId;
            $db_user = $this->db->db_user;
            $result = $this->db->query("SELECT credential_id FROM $db_user.webauthn_credentials WHERE user_id = $userId");
            while ($row = $result->fetch_assoc()) {
                $allowCredentials[] = [
                    'type' => 'public-key',
                    'id' => $row['credential_id']
                ];
            }
        }
        
        return [
            'challenge' => $this->base64UrlEncode($challenge),
            'timeout' => 60000,
            'rpId' => $this->rpId,
            'allowCredentials' => $allowCredentials,
            'userVerification' => 'discouraged'
        ];
    }
    
    /**
     * Verify authentication response
     */
    public function verifyAuthentication($response) {
        if (!isset($_SESSION['webauthn_auth_challenge'])) {
            return ['success' => false, 'error' => 'No pending authentication'];
        }
        
        $challenge = $_SESSION['webauthn_auth_challenge'];
        unset($_SESSION['webauthn_auth_challenge']);
        
        // Parse client data
        $clientDataJSON = $this->base64UrlDecode($response['clientDataJSON']);
        $clientData = json_decode($clientDataJSON, true);
        
        // Verify challenge
        $receivedChallenge = $this->base64UrlDecode($clientData['challenge']);
        if (!hash_equals($challenge, $receivedChallenge)) {
            return ['success' => false, 'error' => 'Challenge mismatch'];
        }
        
        // Find credential
        $credentialId = $response['credentialId'];
        $escapedCredId = $this->db->escape($credentialId);
        $db_user = $this->db->db_user;
        $result = $this->db->query("SELECT * FROM $db_user.webauthn_credentials WHERE credential_id = '$escapedCredId'");
        
        if ($result->num_rows === 0) {
            return ['success' => false, 'error' => 'Unknown credential'];
        }
        
        $credential = $result->fetch_assoc();
        
        // Parse authenticator data
        $authData = $this->base64UrlDecode($response['authenticatorData']);
        $flags = ord($authData[32]);
        
        // Check user present flag
        if (!($flags & 0x01)) {
            return ['success' => false, 'error' => 'User not present'];
        }
        
        // Get signature counter and update
        $signCount = unpack('N', substr($authData, 33, 4))[1];
        $storedCounter = (int)$credential['counter'];
        
        if ($signCount > 0 && $signCount <= $storedCounter) {
            return ['success' => false, 'error' => 'Possible cloned key'];
        }
        
        // Update counter and last used
        $userId = $credential['user_id'];
        
        // Verify Signature
        $publicKey = base64_decode($credential['public_key']);
        $clientDataHash = hash('sha256', $clientDataJSON, true);
        $signedData = $authData . $clientDataHash;
        $signature = $this->base64UrlDecode($response['signature']);
        
        if (!$this->verifySignature($signedData, $signature, $publicKey)) {
            return ['success' => false, 'error' => 'Invalid signature'];
        }

        $this->db->query("UPDATE $db_user.webauthn_credentials SET counter = $signCount, last_used = NOW() WHERE id = {$credential['id']}");
        
        return [
            'success' => true,
            'user_id' => $userId,
            'message' => 'Authentication successful'
        ];
    }
    
    // Manual COSE to PEM conversion for P-256 (ES256)
    private function verifySignature($data, $signature, $coseKey) {
        $pem = $this->coseToPem($coseKey);
        if (!$pem) return false;
        
        // Convert DER signature to ASN.1 if needed (WebAuthn usually returns ASN.1 DER, openssl expects it)
        // However, some implementations might return raw R|S. Browsers usually return ASN.1 DER.
        return openssl_verify($data, $signature, $pem, OPENSSL_ALGO_SHA256) === 1;
    }
    
    private function coseToPem($cose) {
        // Parse COSE key map
        // Simple manual parsing for specific P-256 structure generated by registration
        // A5 01 02 03 26 20 01 21 58 20 [X] 22 58 20 [Y]
        // This is a very specific parser for the expected structure
        
        $offset = 0;
        $map = $this->parseCBORItem($cose, $offset);
        
        if (!is_array($map)) return null;
        
        // Check for EC2 (2) and ES256 (-7) and P-256 (1)
        // Note: PHP array keys from parseCBOR might need handling
        
        // We need x (-2) and y (-3)
        // In parseCBOR map keys are values.
        // Let's rely on the structure or iterate.
        $x = null; $y = null;
        
        // Manual extraction if parseCBOR is complex with non-string keys
        // X is key -2 (0x21 if negative? No, CBOR negative int is major type 1)
        // Key -2 is 0x21. Key -3 is 0x22.
        
        foreach ($map as $k => $v) {
            if ($k === -2) $x = $v;
            if ($k === -3) $y = $v;
        }
        
        if (!$x || !$y) return null;
        
        // Construct Uncompressed Point: 0x04 . X . Y
        $point = "\x04" . $x . $y;
        
        // Wrap in ASN.1 SubjectPublicKeyInfo for P-256
        // Header for P-256: 30 59 30 13 06 07 2A 86 48 CE 3D 02 01 06 08 2A 86 48 CE 3D 03 01 07 03 42 00
        $der = "\x30\x59\x30\x13\x06\x07\x2a\x86\x48\xce\x3d\x02\x01\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07\x03\x42\x00" . $point;
        
        return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64) . "-----END PUBLIC KEY-----";
    }
    
    /**
     * Get user's registered security keys
     */
    public function getUserCredentials($userId) {
        $db_user = $this->db->db_user;
        $result = $this->db->query("SELECT id, name, created_at, last_used FROM $db_user.webauthn_credentials WHERE user_id = $userId ORDER BY created_at DESC");
        $credentials = [];
        while ($row = $result->fetch_assoc()) {
            $credentials[] = $row;
        }
        return $credentials;
    }
    
    /**
     * Remove a credential
     */
    public function removeCredential($userId, $credentialId) {
        $escapedId = (int)$credentialId;
        $db_user = $this->db->db_user;
        return $this->db->query("DELETE FROM $db_user.webauthn_credentials WHERE id = $escapedId AND user_id = $userId");
    }
    
    /**
     * Rename a credential
     */
    public function renameCredential($userId, $credentialId, $newName) {
        $escapedId = (int)$credentialId;
        $escapedName = $this->db->escape($newName);
        $db_user = $this->db->db_user;
        return $this->db->query("UPDATE $db_user.webauthn_credentials SET name = '$escapedName' WHERE id = $escapedId AND user_id = $userId");
    }
    
    /**
     * Check if user has any security keys
     */
    public function hasSecurityKeys($userId) {
        $db_user = $this->db->db_user;
        $result = $this->db->query("SELECT COUNT(*) as cnt FROM $db_user.webauthn_credentials WHERE user_id = $userId");
        return $result->fetch_assoc()['cnt'] > 0;
    }
    
    // Helper functions
    private function generateChallenge($length = 32) {
        return random_bytes($length);
    }
    
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }
    
    /**
     * Simple CBOR parser for attestation objects
     * Handles the subset needed for WebAuthn
     */
    private function parseCBOR($data) {
        $offset = 0;
        return $this->parseCBORItem($data, $offset);
    }
    
    private function parseCBORItem($data, &$offset) {
        if ($offset >= strlen($data)) return null;
        
        $byte = ord($data[$offset++]);
        $majorType = $byte >> 5;
        $additionalInfo = $byte & 0x1F;
        
        $value = $this->parseCBORValue($data, $offset, $additionalInfo);
        
        switch ($majorType) {
            case 0: // Unsigned integer
                return $value;
            case 1: // Negative integer
                return -1 - $value;
            case 2: // Byte string
                $result = substr($data, $offset, $value);
                $offset += $value;
                return $result;
            case 3: // Text string
                $result = substr($data, $offset, $value);
                $offset += $value;
                return $result;
            case 4: // Array
                $arr = [];
                for ($i = 0; $i < $value; $i++) {
                    $arr[] = $this->parseCBORItem($data, $offset);
                }
                return $arr;
            case 5: // Map
                $map = [];
                for ($i = 0; $i < $value; $i++) {
                    $key = $this->parseCBORItem($data, $offset);
                    $val = $this->parseCBORItem($data, $offset);
                    $map[$key] = $val;
                }
                return $map;
            default:
                return null;
        }
    }
    
    private function parseCBORValue($data, &$offset, $additionalInfo) {
        if ($additionalInfo < 24) return $additionalInfo;
        if ($additionalInfo == 24) return ord($data[$offset++]);
        if ($additionalInfo == 25) {
            $val = unpack('n', substr($data, $offset, 2))[1];
            $offset += 2;
            return $val;
        }
        if ($additionalInfo == 26) {
            $val = unpack('N', substr($data, $offset, 4))[1];
            $offset += 4;
            return $val;
        }
        return 0;
    }
}
