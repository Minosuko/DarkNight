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
		<title>Darknight</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/index.css">
	</head>
	<body>
		<h1>Darknight Social</h1>
		<div class="container">
			<div class="transparent_block">
				<div class="content">
					<?php
					if(isset($_GET['t'])){
						$type = $_GET['t'];
						switch($type){
							case 'registered':
								echo "<h1>Email sent, check your mailbox to verify your account.</h1>";
								break;
							case '2FA':
							if(!_is_session_valid(false)) {
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
									echo "<div class='error-message'>Invalid code. Please try again.</div>";
								}
							}
							?>
							<h2 style="margin-bottom: 20px;">Two-Factor Authentication</h2>
							<p style="color: var(--color-text-dim); margin-bottom: 25px;">
								Verify your identity to continue
							</p>
							
							<?php if($hasTOTP): ?>
							<!-- Authenticator App Option -->
							<div class="twofa-method">
								<h3><i class="fa-solid fa-mobile-screen"></i> Authenticator App</h3>
								<form method="post" style="margin-top: 15px;">
									<input type="text" name="code" class="index_input_box" 
										placeholder="Enter 6-digit code" 
										maxlength="6" 
										style="text-align:center; font-size:1.5em; letter-spacing:5px;"
										autocomplete="one-time-code" required>
									<br><br>
									<input type="submit" value="Verify Code" class="btn-primary" style="width:100%;">
								</form>
							</div>
							<?php endif; ?>
							
							<?php if($hasTOTP && $hasSecurityKeys): ?>
							<!-- Divider if both methods available -->
							<div class="twofa-divider">
								<span>or</span>
							</div>
							<?php endif; ?>
							
							<?php if($hasSecurityKeys): ?>
							<!-- Security Key Option -->
							<div class="twofa-method">
								<h3><i class="fa-solid fa-key"></i> Security Key</h3>
								<button onclick="_verify_security_key()" class="btn-primary" style="width:100%; margin-top:15px;">
									<i class="fa-solid fa-fingerprint"></i> Use Security Key
								</button>
							</div>
							<?php endif; ?>
							
							<?php
							break;
							case 'verify':
						if(_verify($_GET['username'],$_GET['user_email'],$_GET['h']))
									echo "<h1>Verified, now you can login :3</h1>";
								else
									echo "<h1>Nah, wrong link uwu</h1>";
								break;
							default:
								echo "<h1>What are you doing here?</h1>";
								break;
						}
					}else{
						echo "<h1>What are you doing here?</h1>";
					}
					?>
					<center><a href="/index.php"><h5>Goto login</h5></a></center>
				</div>
			</div>
		</div>
		<script src="resources/js/jquery.js"></script>
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
		<style>
			.twofa-method {
				background: rgba(255,255,255,0.03);
				padding: 20px;
				border-radius: 12px;
				margin-bottom: 15px;
			}
			.twofa-method h3 {
				margin: 0 0 10px 0;
				font-size: 1.1em;
				color: var(--color-text-main);
			}
			.twofa-method h3 i {
				margin-right: 10px;
				color: var(--color-primary);
			}
			.twofa-divider {
				display: flex;
				align-items: center;
				margin: 20px 0;
				color: var(--color-text-dim);
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
				font-size: 0.9em;
			}
			.error-message {
				background: rgba(239, 68, 68, 0.15);
				color: #ef4444;
				padding: 10px 15px;
				border-radius: 8px;
				margin-bottom: 15px;
				text-align: center;
			}
		</style>
		<script>
			var isMobile = function() {
				let check = false;
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				return check;
			};
			if(isMobile()){
				document.getElementsByClassName('container')[0].style.width = "100%";
				document.getElementsByClassName('container')[0].style.zoom = "0.75";
			}
			
			// WebAuthn Security Key Verification
			async function _verify_security_key() {
				try {
					// Get authentication options from server
					const optionsRes = await fetch('/worker/webauthn_verify.php');
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
					
					const verifyRes = await fetch('/worker/webauthn_verify.php', {
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
		</script>
	</body>
</html>