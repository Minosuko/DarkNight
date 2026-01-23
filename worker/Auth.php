<?php
session_start();
require_once '../includes/functions.php';
require_once '../includes/classes/WebAuthn.php';

header("Content-Type: application/json");

// Helper to validate session
function require_login($allow_partial = false) {
    if (!_is_session_valid(false, $allow_partial)) {
        echo json_encode(['success' => 0, 'error' => 'Not logged in']);
        exit();
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

// Handle POST requests
if ($method === 'POST') {
    
    // --- Captcha Check ---
    if ($action === 'check_captcha') {
        if(!isset($_POST['captcha']) || !isset($_SESSION['captcha_code'])) die("0");
        echo $_POST['captcha'] == $_SESSION['captcha_code'] ? 1 : 0;
        exit();
    }

    // --- Forgot Password ---
    if ($action === 'forgot_password') {
        if(!isset($_POST['email']) || !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
            die(json_encode(['success' => 0, 'error' => 'invalid_email']));
        }
        $email = $_POST['email'];
        $db = Database::getInstance();
        global $db_user;
        
        $row = User::findByLogin($email);
        if ($row) {
            $token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiration
            
            $db->query("DELETE FROM $db_user.password_resets WHERE email = '$email'");
            $db->query("INSERT INTO $db_user.password_resets (email, token, expires_at) VALUES ('$email', '$token', '$expires_at')");
            
            $link = (isset($_SERVER["HTTPS"]) ? 'https' : 'http')."://". $_SERVER['SERVER_NAME'].'/verify.php?t=reset&token='.$token.'&email='.urlencode($email);
            $name = ($row['user_firstname'] || $row['user_lastname']) ? ($row['user_firstname'].' '.$row['user_lastname']) : $row['user_nickname'];
            
            SendResetMail($email, $name, $link);
        }
        
        // Always return success to prevent email enumeration
        die(json_encode(['success' => 1, 'message' => 'If an account exists with this email, a reset link has been sent.']));
    }

    // --- Reset Password ---
    if ($action === 'reset_password') {
        if(!isset($_POST['token']) || !isset($_POST['email']) || !isset($_POST['password'])) {
            die(json_encode(['success' => 0, 'error' => 'missing_params']));
        }
        $token = $_POST['token'];
        $email = $_POST['email'];
        $password = decryptPassword($_POST['password']);
        
        if (strlen($password) < 6) {
            die(json_encode(['success' => 0, 'error' => 'password_too_short']));
        }
        
        $db = Database::getInstance();
        global $db_user;
        
        $stmt = $db->query("SELECT * FROM $db_user.password_resets WHERE email = '$email' AND token = '$token' AND expires_at > NOW()");
        if ($stmt->num_rows === 0) {
            die(json_encode(['success' => 0, 'error' => 'invalid_or_expired_token']));
        }
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $db->query("UPDATE $db_user.users SET user_password = '$hashed_password' WHERE user_email = '$email'");
        $db->query("DELETE FROM $db_user.password_resets WHERE email = '$email'");
        
        die(json_encode(['success' => 1, 'message' => 'Password has been reset successfully.']));
    }

    // --- Login & Register (No Auth Required) ---
    if ($action === 'login' || isset($_POST['login'])) {
        if(!isset($_POST['captcha']) || !isset($_SESSION['captcha_code'])) die();
        if($_POST['captcha'] != $_SESSION['captcha_code']) {
            die(json_encode(['success' => 0, 'err' => 'invalid_captcha_0']));
        }
        $_SESSION['refresh_captcha'] = 1;

        $userlogin  = $_POST['userlogin'];
        $userpass   = decryptPassword($_POST['userpass']);
        
        $row = User::findByLogin($userlogin);
        if($row && password_verify($userpass, $row['user_password'])){
            $time = isset($_POST['remember_me']) ? 86400*365 : 86400*30;
            $has2FA = Has2FA($row['user_id']); // Global function
            
            new_session($time, $row['user_id'], ($has2FA ? 0 : 1));
            
            if($row['active'] == 0) die(json_encode(['success' => 1, 'go' => 'verify.php?t=registered']));
            elseif($has2FA) die(json_encode(['success' => 1, 'go' => 'verify.php?t=2FA']));
            else die(json_encode(['success' => 1, 'go' => 'home.php']));
        }
        die(json_encode(['success' => 0, 'err' => 'invalid_login']));
    }

    if ($action === 'register' || isset($_POST['register'])) {
        if(!isset($_POST['captcha']) || !isset($_SESSION['captcha_code'])) die();
        if($_POST['captcha'] != $_SESSION['captcha_code']) {
            die(json_encode(['success' => 0, 'err' => 'invalid_captcha_1']));
        }
        $_SESSION['refresh_captcha'] = 1;

        $usernickname = $_POST['usernickname'];
        $useremail    = $_POST['useremail'];
        
        if(!validateDate($_POST['birthday'])) die(json_encode(['success' => 0, 'err' => 'invalid_date']));
        if(!_is_username_valid($usernickname)) die(json_encode(['success' => 0, 'err' => 'invalid_nickname']));
        if(!filter_var($useremail, FILTER_VALIDATE_EMAIL)) die(json_encode(['success' => 0, 'err' => 'invalid_email']));

        $existing = User::findByNicknameOrEmail($usernickname, $useremail);
        if($existing){
            if(strtolower($usernickname) == strtolower($existing['user_nickname']) && !empty($usernickname))
                die(json_encode(['success' => 0, 'err' => 'exist_nickname']));
            if(strtolower($useremail) == strtolower($existing['user_email']))
                die(json_encode(['success' => 0, 'err' => 'exist_email']));
        }

        $userpass = password_hash(decryptPassword($_POST['userpass']), PASSWORD_DEFAULT);
        $timestamp = time();
        $usergender = in_array($_POST['usergender'], ["F","M","U"]) ? $_POST['usergender'] : "U";
        
        $query = User::create(
            $_POST['userfirstname'], 
            $_POST['userlastname'], 
            $usernickname, 
            $userpass, 
            $useremail, 
            $usergender, 
            strtotime($_POST['birthday']), 
            '', 
            $timestamp
        );

        if($query){
            $link = (isset($_SERVER["HTTPS"]) ? 'https' : 'http')."://". $_SERVER['SERVER_NAME'].'/verify.php?t=verify&user_email='.htmlspecialchars($useremail).'&username='.htmlspecialchars($usernickname).'&h='.hash('sha256',($userpass.$timestamp));
            SendVerifyMail($useremail, $_POST['userfirstname'].' '.$_POST['userlastname'], $link);
            die(json_encode(['success' => 1, 'go' => 'verify.php?t=registered']));
        }
        die(json_encode(['success' => 0, 'err' => 'db_error']));
    }

    // --- 2FA Verification (Partial Auth Allowed) ---
    if ($action === 'verify_2fa') {
        if (!isset($_POST['user_id']) || !isset($_POST['code'])) {
            die(json_encode(['success' => 0, 'error' => 'missing_params']));
        }
        $user_id = intval($_POST['user_id']);
        $code = $_POST['code'];
        $db = Database::getInstance();
        $ga = $GLOBALS['GoogleAuthenticator'];

        global $db_user;
        $result = $db->query("SELECT auth_key FROM $db_user.twofactorauth WHERE user_id = $user_id AND is_enabled = 1");
        if ($result->num_rows === 0) die(json_encode(['success' => 0, 'error' => '2fa_not_enabled']));
        
        $secret = $result->fetch_assoc()['auth_key'];
        if ($ga->verifyCode($secret, $code, 2)) {
            // If successful, we should upgrade the session if it's the current user
            // But this endpoint is often called by the verify page via AJAX.
            // Let's check session matching
            $data = _get_data_from_token();
            if ($data && $data['user_id'] == $user_id) {
                _upgrade_session_2fa($user_id);
            }
            echo json_encode(['success' => 1, 'message' => 'verified']);
        } else {
            echo json_encode(['success' => 0, 'error' => 'invalid_code']);
        }
        exit();
    }
    
    // --- WebAuthn Verify (Partial Auth Allowed) ---
    if ($action === 'webauthn_verify') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['response'])) die(json_encode(['success' => 0, 'error' => 'Invalid request']));

        $webauthn = new WebAuthn();
        $result = $webauthn->verifyAuthentication($input['response']);

        if ($result['success']) {
            _upgrade_session_2fa($result['user_id']);
            $_SESSION['2fa_verified'] = true;
            $_SESSION['2fa_verified_at'] = time();
            echo json_encode(['success' => 1, 'message' => 'Authentication successful', 'redirect' => 'home.php']);
        } else {
            echo json_encode(['success' => 0, 'error' => $result['error']]);
        }
        exit();
    }

    // --- Authenticated Actions Below ---
    require_login(); 
    $data = _get_data_from_token();
    $user_id = $data['user_id'];
    $db = Database::getInstance();

    // Session Management
    if ($action === 'revoke_session') {
        if (isset($_POST['revoke_all'])) {
            $current_browser_id = $db->escape($_COOKIE['browser_id']);
            global $db_user;
            $db->query("DELETE FROM $db_user.session WHERE user_id = $user_id AND browser_id != '$current_browser_id'");
        } elseif (isset($_POST['session_id'])) {
            $sid = $db->escape($_POST['session_id']);
             global $db_user;
            $db->query("DELETE FROM $db_user.session WHERE session_id = '$sid' AND user_id = $user_id");
        }
        echo json_encode(['success' => 1]);
        exit();
    }

    // 2FA Management
    if ($action === 'setup_2fa') {
        if (!isset($_POST['code'])) die(json_encode(['success' => 0, 'error' => 'missing_code']));
        global $db_user;
        $result = $db->query("SELECT auth_key FROM $db_user.twofactorauth WHERE user_id = $user_id ORDER BY is_enabled ASC LIMIT 1");
        if ($result->num_rows === 0) die(json_encode(['success' => 0, 'error' => 'no_pending_setup']));
        
        $secret = $result->fetch_assoc()['auth_key'];
        $ga = $GLOBALS['GoogleAuthenticator'];
        if ($ga->verifyCode($secret, $_POST['code'], 2)) {
            $db->query("UPDATE $db_user.twofactorauth SET is_enabled = 1 WHERE user_id = $user_id AND auth_key = '$secret'");
            echo json_encode(['success' => 1, 'message' => '2fa_enabled']);
        } else {
            echo json_encode(['success' => 0, 'error' => 'invalid_code']);
        }
        exit();
    }

    if ($action === 'disable_2fa') {
        if (!isset($_POST['password']) || !isset($_POST['code'])) die(json_encode(['success' => 0, 'error' => 'missing_params']));
        
        global $db_user;
        $r = $db->query("SELECT user_password FROM $db_user.users WHERE user_id = $user_id")->fetch_assoc();
        if (!password_verify($_POST['password'], $r['user_password'])) die(json_encode(['success' => 0, 'error' => 'invalid_password']));

        $r = $db->query("SELECT auth_key FROM $db_user.twofactorauth WHERE user_id = $user_id AND is_enabled = 1")->fetch_assoc();
        if (!$r) die(json_encode(['success' => 0, 'error' => '2fa_not_enabled']));

        $ga = $GLOBALS['GoogleAuthenticator'];
        if (!$ga->verifyCode($r['auth_key'], $_POST['code'], 2)) die(json_encode(['success' => 0, 'error' => 'invalid_2fa_code']));

        $db->query("DELETE FROM $db_user.twofactorauth WHERE user_id = $user_id");
        echo json_encode(['success' => 1, 'message' => '2fa_disabled']);
        exit();
    }

    // WebAuthn Management
    if ($action === 'webauthn_register') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['response'])) die(json_encode(['success' => 0, 'error' => 'Invalid request']));
        
        $webauthn = new WebAuthn();
        $result = $webauthn->verifyRegistration($input['response']);
        
        if ($result['success']) echo json_encode(['success' => 1, 'message' => 'Security key registered successfully']);
        else echo json_encode(['success' => 0, 'error' => $result['error']]);
        exit();
    }

    if ($action === 'webauthn_remove') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['credential_id'])) die(json_encode(['success' => 0, 'error' => 'Missing ID']));
        
        $webauthn = new WebAuthn();
        if ($webauthn->removeCredential($user_id, $input['credential_id'])) echo json_encode(['success' => 1]);
        else echo json_encode(['success' => 0, 'error' => 'Failed']);
        exit();
    }

    if ($action === 'webauthn_rename') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['credential_id']) || !isset($input['name'])) die(json_encode(['success' => 0, 'error' => 'Missing params']));
        
        $webauthn = new WebAuthn();
        if ($webauthn->renameCredential($user_id, $input['credential_id'], trim($input['name']))) echo json_encode(['success' => 1]);
        else echo json_encode(['success' => 0, 'error' => 'Failed']);
        exit();
    }

} elseif ($method === 'GET') {
    
    // --- Public GET Actions (Login Flow) ---
    if ($action === 'webauthn_verify') {
        $userId = null;
        if (_is_session_valid(false, true)) {
            $d = _get_data_from_token();
            $userId = $d['user_id'];
        }
        if (isset($_GET['user_id'])) $userId = (int)$_GET['user_id'];
        
        $webauthn = new WebAuthn();
        echo json_encode(['success' => 1, 'options' => $webauthn->getAuthenticationOptions($userId)]);
        exit();
    }

    // --- Authenticated GET Actions ---
    require_login(true); // Allow partial mainly for status check if needed, strictly speaking full auth preferred for management
    $data = _get_data_from_token();
    $user_id = $data['user_id'];
    $db = Database::getInstance();

    if ($action === 'session_list') {
        $raw_browser_id = $_COOKIE['browser_id'] ?? '';
        $current_browser_id = $db->escape($raw_browser_id);
        global $db_user;
        $result = $db->query("SELECT *, (browser_id = '$current_browser_id') as is_current_dev FROM $db_user.session WHERE user_id = $user_id ORDER BY is_current_dev DESC, last_online DESC");
        $sessions = [];
        while($row = $result->fetch_assoc()) {
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
                'is_current' => ($row['browser_id'] === $raw_browser_id),
                'device_str' => $row['session_device']
            ];
        }
        echo json_encode(['success' => 1, 'sessions' => $sessions]);
        exit();
    }

    if ($action === '2fa_status') {
        $hasTOTP = $db->query("SELECT is_enabled FROM twofactorauth WHERE user_id = $user_id AND is_enabled = 1")->num_rows > 0;
        $webauthn = new WebAuthn();
        $hasSecurityKey = $webauthn->hasSecurityKeys($user_id);
        
        echo json_encode([
            'success' => 1,
            'enabled' => $hasTOTP || $hasSecurityKey,
            'totp_enabled' => $hasTOTP,
            'security_key_enabled' => $hasSecurityKey,
            'security_keys' => $webauthn->getUserCredentials($user_id)
        ]);
        exit();
    }

    if ($action === 'setup_2fa') {
        $ga = $GLOBALS['GoogleAuthenticator'];
        $secret = $ga->createSecret(16);
        global $db_user;
        $userInfo = $db->query("SELECT user_email, user_nickname FROM $db_user.users WHERE user_id = $user_id")->fetch_assoc();
        $label = $userInfo['user_nickname'] ?: $userInfo['user_email'];
        
        $qrUrl = $ga->getQRCodeGoogleUrl($label, $secret, 'Darknight Social');
        $otpAuthUrl = 'otpauth://totp/' . rawurlencode('Darknight Social:' . $label) . '?secret=' . $secret . '&issuer=' . rawurlencode('Darknight Social');
        $qrDataUri = QRCode::getDataUri($otpAuthUrl, 5);
        
        $escapedSecret = $db->escape($secret);
        $db->query("DELETE FROM $db_user.twofactorauth WHERE user_id = $user_id AND is_enabled = 0");
        $db->query("INSERT INTO $db_user.twofactorauth (auth_key, user_id, is_enabled) VALUES ('$escapedSecret', $user_id, 0)");
        
        echo json_encode(['success' => 1, 'secret' => $secret, 'qr' => $qrDataUri, 'qr_url' => $qrUrl]);
        exit();
    }

    if ($action === 'webauthn_register') {
        global $db_user;
        $userInfo = $db->query("SELECT user_email, user_nickname, user_firstname, user_lastname FROM $db_user.users WHERE user_id = $user_id")->fetch_assoc();
        $userName = $userInfo['user_nickname'] ?: $userInfo['user_email'];
        $displayName = trim($userInfo['user_firstname'] . ' ' . $userInfo['user_lastname']) ?: $userName;
        
        $webauthn = new WebAuthn();
        echo json_encode(['success' => 1, 'options' => $webauthn->getRegistrationOptions($user_id, $userName, $displayName)]);
        exit();
    }
}
?>
