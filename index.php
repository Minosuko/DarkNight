<?php 
session_start();
require_once 'includes/functions.php';
if(_is_session_valid(false)){
	$data = _get_data_from_token();
	$has2FA = Has2FA($data['user_id']);
	if($has2FA)
		header("Location: verify.php?t=2FA");
	else
		header("Location: home.php");
}
$_SESSION['refresh_captcha'] = 1;
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
		<h1>Darknight</h1>
		<div class="container">
			<div class="transparent_block">
				<div class="tab">
					<button class="tablink active" onclick="openTab(event,'signin')" id="link1"><lang lang="lang__022"></lang></button>
					<button class="tablink" onclick="openTab(event,'signup')" id="link2"><lang lang="lang__032"></lang></button>
				</div>
				<div class="content">
					<div class="tabcontent" id="signin">
						<div class="index_input_box">
							<label for="userlogin"><lang lang="lang__022"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="text" name="userlogin" id="loginuseremail" placeholder="Username or email">
						</div>
						<br>
						<div class="index_input_box">
							<label for="userpass"><lang lang="lang__023"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="password" name="userpass" id="loginuserpass" placeholder="********">
						</div>
						<br>
						<label for="remember_me"><lang lang="lang__024"></lang> </label>
						<input type="checkbox" name="remember_me" id="remember-me">
						<br>
						<div class="index_input_box">
							<img src="data/captcha.php" alt='captchaimg' id="captchaimg0">
							<div class="required" id="required_0"></div>
							<br>
							<input type="text" name="captcha" id="captcha_0" placeholder="CAPCHA">
						</div>
						<br><br>
						<input type="submit" value="Login" name="login" lang="lang__022" onclick="validateLogin()">
					</div>
					<div class="tabcontent" id="signup">
						<div class="index_input_box name_input">
							<label for="userfirstname"><lang lang="lang__025"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="text" name="userfirstname" id="userfirstname" lang="lang__025">
						</div>		
						<div class="index_input_box name_input right_content_box">
							<label for="userlastname"><lang lang="lang__026"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="text" name="userlastname" id="userlastname" lang="lang__026">
						</div>
						<br>
						<br>
						<div class="index_input_box">
							<label for="usernickname"><lang lang="lang__027"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="text" name="usernickname" id="usernickname"  lang="lang__027">
						</div>
						<br>
						<div class="index_input_box">
							<label for="userpass"><lang lang="lang__023"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="password" name="userpass" id="userpass" lang="lang__023">
						</div>
						<br>
						<div class="index_input_box">
							<label for="userpassconfirm"><lang lang="lang__028"></lang><span>*</span></label>
							<div class="required"></div><br>
							<input type="password" name="userpassconfirm" id="userpassconfirm" lang="lang__028">
						</div>
						<br>
						<div class="index_input_box">
							<label for="useremail"><lang lang="lang__036"></lang><span>*</span></label>
							<div class="required"></div>
							<br>
							<input type="text" name="useremail" id="useremail" lang="lang__036">
						</div>
						<br>
						<div class="index_input_box">
							<div class="required"></div>
							<label for="birthday"><lang lang="lang__029"></lang><span>*</span></label><br>
							<input type="date" id="birthday" name="birthday" value="<?php echo date('Y-m-d', time()); ?>">
						</div>
						<br>
						<div class="index_input_box">
							<div class="required"></div>
							<input type="radio" name="usergender" value="M" id="malegender" class="usergender">
							<label><lang lang="lang__030"></lang></label>
							<input type="radio" name="usergender" value="F" id="femalegender" class="usergender">
							<label><lang lang="lang__031"></lang></label>
							<input type="radio" name="usergender" value="U" id="othergender" class="usergender">
							<label><lang lang="lang__077"></lang></label>
						</div>
						<br>
						<div class="index_input_box">
						<img src="data/captcha.php" alt='captchaimg' id="captchaimg1">
							<div  class="required" id="required_1"></div>
							<br>
							<input type="text" name="captcha" id="captcha_1" placeholder="CAPCHA">
						</div>
						<br><br>
						<input type="submit" value="Create Account" lang="lang__040" name="register" onclick="validateRegister()">
					</div>
				</div>
			</div>
		</div>
		<script src="resources/js/jquery.js"></script>
		<script src="resources/js/index.js"></script>
	</body>
</html>