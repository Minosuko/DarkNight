<?php
require_once "includes/functions.php";
if(_is_session_valid(false)){
	$data = _get_data_from_token();
	$has2FA = Has2FA($data['user_id']);
	$checkActive = checkActive();
	if(!$has2FA && $checkActive)
		header("Location: home.php");
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Darknight | Verification</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/index.css">
		<style>
			body {
				background-image: url('resources/img/background.jpg');
				background-size: cover;
				background-position: center;
				background-attachment: fixed;
				margin: 0;
				font-family: 'Roboto', sans-serif;
				display: flex;
				justify-content: center;
				align-items: center;
				min-height: 100vh;
				color: var(--color-text-main);
			}
			.verification-card {
				background: rgba(18, 18, 18, 0.95);
				backdrop-filter: blur(10px);
				padding: 40px;
				border-radius: 20px;
				box-shadow: 0 10px 30px rgba(0,0,0,0.5);
				width: 100%;
				max-width: 450px;
				border: 1px solid var(--color-border);
				text-align: center;
			}
			.logo-title {
				font-size: 2rem;
				font-weight: 800;
				margin-bottom: 10px;
				background: linear-gradient(45deg, var(--color-primary), #00c6ff);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				letter-spacing: -1px;
			}
			.subtitle {
				color: var(--color-text-secondary);
				margin-bottom: 30px;
				font-size: 0.95rem;
			}
			.twofa-method {
				background: rgba(255,255,255,0.03);
				padding: 20px;
				border-radius: 12px;
				margin-bottom: 15px;
				border: 1px solid var(--color-border);
				transition: all 0.2s;
			}
			.twofa-method:hover {
				background: rgba(255,255,255,0.05);
				border-color: var(--color-primary-transparent);
			}
			.twofa-method h3 {
				margin: 0 0 15px 0;
				font-size: 1.1em;
				color: var(--color-text-main);
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 10px;
			}
			.twofa-method h3 i {
				color: var(--color-primary);
			}
			.twofa-divider {
				display: flex;
				align-items: center;
				margin: 25px 0;
				color: var(--color-text-dim);
				font-size: 0.85rem;
				text-transform: uppercase;
				letter-spacing: 1px;
			}
			.twofa-divider::before,
			.twofa-divider::after {
				content: '';
				flex: 1;
				height: 1px;
				background: var(--color-border);
			}
			.twofa-divider span {
				padding: 0 15px;
			}
			.error-message {
				background: rgba(239, 68, 68, 0.1);
				color: #ef4444;
				padding: 12px;
				border-radius: 8px;
				margin-bottom: 20px;
				font-size: 0.9rem;
				border: 1px solid rgba(239, 68, 68, 0.2);
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
			}
			.code-input {
				background: var(--color-bg);
				border: 2px solid var(--color-border);
				color: var(--color-primary);
				font-family: monospace;
				font-size: 2em;
				letter-spacing: 8px;
				text-align: center;
				width: 100%;
				border-radius: 12px;
				padding: 15px;
				transition: all 0.2s;
			}
			.code-input:focus {
				border-color: var(--color-primary);
				box-shadow: 0 0 0 4px var(--color-primary-transparent);
			}
			.btn-link {
				color: var(--color-text-secondary);
				text-decoration: none;
				font-size: 0.9rem;
				transition: color 0.2s;
			}
			.btn-link:hover {
				color: var(--color-primary);
			}
			.icon-circle {
				width: 60px;
				height: 60px;
				background: var(--color-surface-hover);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				margin: 0 auto 20px;
				font-size: 1.5rem;
				color: var(--color-primary);
			}
		</style>
	</head>
	<body>
		<div class="verification-card">
			<div class="logo-title">Darknight</div>
			
			<div class="content">
				<?php
				if(isset($_GET['t'])){
					$type = $_GET['t'];
					switch($type){
						case 'registered':
							echo '<div class="icon-circle"><i class="fa-solid fa-envelope-open-text"></i></div>';
							echo "<h2>Verify Your Email</h2>";
							echo "<p class='subtitle'>We've sent a verification link to your email address. Please check your inbox (and spam folder) to activate your account.</p>";
							break;
						case '2FA':
							if(!_is_session_valid(false, true)) {
								header("Location: index.php");
								exit();
							}
							$data = _get_data_from_token();
							$userId = $data['user_id'];
							$db = Database::getInstance();
							
							// Check TOTP status
							$totpResult = $db->query("SELECT is_enabled FROM twofactorauth WHERE user_id = $userId AND is_enabled = 1");
							$hasTOTP = $totpResult->num_rows > 0;
							
							// Check Security Key status
							require_once 'includes/classes/WebAuthn.php';
							$webauthn = new WebAuthn();
							$hasSecurityKeys = $webauthn->hasSecurityKeys($userId);
							
							if(!$hasTOTP && !$hasSecurityKeys) {
								header("Location: home.php");
								exit();
							}
							
							if(isset($_POST['code'])){
								$verify = _verify_2FA($_POST['code'], $userId);
								if($verify){
									$_SESSION['2fa_verified'] = true;
									header("Location: home.php");
									exit();
								} else {
									echo "<div class='error-message'><i class='fa-solid fa-circle-exclamation'></i> Invalid code. Please try again.</div>";
								}
							}
							?>
							<div class="icon-circle"><i class="fa-solid fa-shield-check"></i></div>
							<h2 style="margin: 0 0 5px 0;">Security Check</h2>
							<p class="subtitle">
								Please verify your identity to continue
							</p>
							
							<?php if($hasTOTP): ?>
							<!-- Authenticator App Option -->
							<div class="twofa-method">
								<h3><i class="fa-solid fa-mobile-screen"></i> Authenticator App</h3>
								<form method="post">
									<input type="text" name="code" class="code-input" 
										placeholder="000000" 
										maxlength="6" 
										autocomplete="one-time-code" required>
									<br><br>
									<input type="submit" value="Verify" class="btn-primary" style="width:100%; padding: 12px; font-size: 1rem;">
								</form>
							</div>
							<?php endif; ?>
							
							<?php if($hasTOTP && $hasSecurityKeys): ?>
							<div class="twofa-divider">
								<span>Or use</span>
							</div>
							<?php endif; ?>
							
							<?php if($hasSecurityKeys): ?>
							<!-- Security Key Option -->
							<button onclick="_verify_security_key()" class="btn-secondary-outline" style="width:100%; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 10px;">
								<i class="fa-solid fa-microchip"></i> Use Security Key / Passkey
							</button>
							<?php endif; ?>
							
							<?php
							break;
						case 'verify':
							if(_verify($_GET['username'],$_GET['user_email'],$_GET['h'])) {
								echo '<div class="icon-circle" style="color:#22c55e;"><i class="fa-solid fa-check"></i></div>';
								echo "<h2>Account Verified!</h2>";
								echo "<p class='subtitle'>Your account has been successfully verified. You can now log in.</p>";
								echo '<a href="/index.php" class="btn-primary" style="display:inline-block; width:100%; padding:12px; text-decoration:none;">Go to Login</a>';
							} else {
								echo '<div class="icon-circle" style="color:#ef4444;"><i class="fa-solid fa-xmark"></i></div>';
								echo "<h2>Verification Failed</h2>";
								echo "<p class='subtitle'>The verification link is invalid or has expired.</p>";
							}
							break;
                        case 'forgot':
                            ?>
                            <div class="icon-circle"><i class="fa-solid fa-key"></i></div>
                            <h2>Reset Password</h2>
                            <p class="subtitle">Enter your email address and we'll send you a link to reset your password.</p>
                            <form id="forgot-form" onsubmit="return handleForgot(event)">
                                <div class="input-group">
                                    <input type="email" id="forgot-email" required placeholder=" " style="width:100%; padding: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; color: white;">
                                    <label for="forgot-email" style="position: absolute; left: 10px; top: -10px; background: #121212; padding: 0 5px; font-size: 0.8rem; color: var(--color-text-secondary);">Email Address</label>
                                </div>
                                <div id="forgot-message" style="margin-bottom: 15px; font-size: 0.9rem;"></div>
                                <button type="submit" class="btn-primary" id="forgot-submit" style="width:100%; padding: 12px;">Send Reset Link</button>
                            </form>
                            <?php
                            break;
                        case 'reset':
                            if(!isset($_GET['token']) || !isset($_GET['email'])) {
                                header("Location: index.php");
                                exit();
                            }
                            ?>
                            <div class="icon-circle"><i class="fa-solid fa-lock"></i></div>
                            <h2>Choose New Password</h2>
                            <p class="subtitle">Please enter your new password below.</p>
                            <form id="reset-form" onsubmit="return handleReset(event)">
                                <input type="hidden" id="reset-token" value="<?php echo htmlspecialchars($_GET['token']); ?>">
                                <input type="hidden" id="reset-email" value="<?php echo htmlspecialchars($_GET['email']); ?>">
                                <div class="input-group" style="margin-bottom: 20px;">
                                    <input type="password" id="reset-password" required placeholder=" " style="width:100%; padding: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; color: white;">
                                    <label for="reset-password" style="position: absolute; left: 10px; top: -10px; background: #121212; padding: 0 5px; font-size: 0.8rem; color: var(--color-text-secondary);">New Password</label>
                                </div>
                                <div class="input-group" style="margin-bottom: 20px;">
                                    <input type="password" id="reset-confirm" required placeholder=" " style="width:100%; padding: 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; color: white;">
                                    <label for="reset-confirm" style="position: absolute; left: 10px; top: -10px; background: #121212; padding: 0 5px; font-size: 0.8rem; color: var(--color-text-secondary);">Confirm Password</label>
                                </div>
                                <div id="reset-message" style="margin-bottom: 15px; font-size: 0.9rem;"></div>
                                <button type="submit" class="btn-primary" id="reset-submit" style="width:100%; padding: 12px;">Update Password</button>
                            </form>
                            <?php
                            break;
						default:
							echo "<h1>404</h1><p class='subtitle'>Page not found</p>";
							break;
					}
				}else{
					echo "<h1>404</h1><p class='subtitle'>Page not found</p>";
				}
				?>
				
				<?php if(!isset($_GET['t']) || $_GET['t'] !== 'verify'): ?>
				<div style="margin-top: 30px; border-top: 1px solid var(--color-border); padding-top: 20px;">
					<a href="/index.php" class="btn-link"><i class="fa-solid fa-arrow-left"></i> Back to Login</a>
				</div>
				<?php endif; ?>
			</div>
		</div>
		<script src="resources/js/jquery.js"></script>
		<script src="resources/js/i18n.js"></script>
		<script>
			// (WebAuthn script remains the same)
			var isMobile = function() {
				let check = false;
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				return check;
			};
			// The original mobile check and container styling are no longer needed due to the new responsive design.
			// if(isMobile()){
			// 	document.getElementsByClassName('container')[0].style.width = "100%";
			// 	document.getElementsByClassName('container')[0].style.zoom = "0.75";
			// }
			
			// WebAuthn Security Key Verification
			async function _verify_security_key() {
				try {
					// Get authentication options from server
					const optionsRes = await fetch('/worker/Auth.php?action=webauthn_verify');
					const optionsData = await optionsRes.json();
					
					if (!optionsData.success) {
						alert('Failed to get authentication options');
						return;
					}
					
					const options = optionsData.options;
					
					// Convert base64url to ArrayBuffer
					options.challenge = base64UrlToBuffer(options.challenge);
					if (options.allowCredentials) {
						options.allowCredentials = options.allowCredentials.map(cred => ({
							...cred,
							id: base64UrlToBuffer(cred.id)
						}));
					}
					
					// Call WebAuthn API
					const credential = await navigator.credentials.get({ publicKey: options });
					
					// Send response to server
					const response = {
						credentialId: bufferToBase64Url(credential.rawId),
						clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
						authenticatorData: bufferToBase64Url(credential.response.authenticatorData),
						signature: bufferToBase64Url(credential.response.signature)
					};
					
					const verifyRes = await fetch('/worker/Auth.php?action=webauthn_verify', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ response: response })
					});
					
					const verifyData = await verifyRes.json();
					
					if (verifyData.success) {
						window.location.href = verifyData.redirect || '/home.php';
					} else {
						alert('Verification failed: ' + verifyData.error);
					}
				} catch (err) {
					console.error('WebAuthn error:', err);
					alert('Security key verification failed. Please try again.');
				}
			}
			
			function base64UrlToBuffer(base64url) {
				const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
				const padLen = (4 - base64.length % 4) % 4;
				const padded = base64 + '='.repeat(padLen);
				const binary = atob(padded);
				const buffer = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					buffer[i] = binary.charCodeAt(i);
				}
				return buffer.buffer;
			}
			
			function bufferToBase64Url(buffer) {
				const bytes = new Uint8Array(buffer);
				let binary = '';
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				const base64 = btoa(binary);
				return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
			}

            async function handleForgot(e) {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value;
                const messageDiv = document.getElementById('forgot-message');
                const submitBtn = document.getElementById('forgot-submit');
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
                
                try {
                    const formData = new FormData();
                    formData.append('action', 'forgot_password');
                    formData.append('email', email);
                    
                    const res = await fetch('/worker/Auth.php', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        messageDiv.style.color = '#22c55e';
                        messageDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + data.message;
                        document.getElementById('forgot-form').reset();
                    } else {
                        messageDiv.style.color = '#ef4444';
                        messageDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error: ' + data.error;
                    }
                } catch (err) {
                    messageDiv.style.color = '#ef4444';
                    messageDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Network error. Please try again.';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Send Reset Link';
                }
                return false;
            }

            async function handleReset(e) {
                e.preventDefault();
                const token = document.getElementById('reset-token').value;
                const email = document.getElementById('reset-email').value;
                const password = document.getElementById('reset-password').value;
                const confirm = document.getElementById('reset-confirm').value;
                const messageDiv = document.getElementById('reset-message');
                const submitBtn = document.getElementById('reset-submit');
                
                if (password !== confirm) {
                    messageDiv.style.color = '#ef4444';
                    messageDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Passwords do not match.';
                    return false;
                }
                
                if (password.length < 6) {
                    messageDiv.style.color = '#ef4444';
                    messageDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Password must be at least 6 characters.';
                    return false;
                }
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
                
                try {
                    const formData = new FormData();
                    formData.append('action', 'reset_password');
                    formData.append('token', token);
                    formData.append('email', email);
                    formData.append('password', btoa(password));
                    
                    const res = await fetch('/worker/Auth.php', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        messageDiv.style.color = '#22c55e';
                        messageDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + data.message;
                        setTimeout(() => {
                            window.location.href = 'index.php';
                        }, 2000);
                    } else {
                        messageDiv.style.color = '#ef4444';
                        messageDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error: ' + data.error;
                    }
                } catch (err) {
                    messageDiv.style.color = '#ef4444';
                    messageDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Network error. Please try again.';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Update Password';
                }
                return false;
            }
		</script>
	</body>
</html>