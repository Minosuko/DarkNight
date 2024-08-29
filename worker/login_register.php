<?php
session_start();
require_once '../includes/functions.php';
if(!isset($_POST['captcha']) || !isset($_SESSION['captcha_code']))
	die();
if(_is_session_valid(false))
	die();
header("content-type: application/json");
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	if($_POST['captcha'] != $_SESSION['captcha_code'])
		die('{"success":0,"err":"invalid_captcha_'.(isset($_POST['login']) ? 0 : (isset($_POST['register']) ? 1 : 0)).'"}');
	$_SESSION['refresh_captcha'] = 1;
	if (isset($_POST['login'])) {
		$userlogin  = $_POST['userlogin'];
		$userpass   = $_POST['userpass'];
		$query = $conn->query(
			sprintf(
				"SELECT * FROM users WHERE user_email LIKE '%s' OR  user_nickname LIKE '%s'",
				$conn->real_escape_string($userlogin),
				$conn->real_escape_string($userlogin)
			)
		);
		if($query){
			if($query->num_rows == 1) {
				$row = $query->fetch_assoc();
				if(password_verify($userpass, $row['user_password'])){
					if(isset($_POST['remember_me']))
						$time = 86400*365;
					else
						$time = 86400*30;
					$has2FA = Has2FA($row['user_id']);
					_setcookie("token", $row['user_token'], $time);
					new_session($time,$row['user_id'],($has2FA ? 0 : 1));
					if($row['active'] == 0)
						die('{"success":1,"go":"verify.php?t=registered"}');
					elseif($has2FA)
						die('{"success":1,"go":"verify.php?t=2FA"}');
					else
						die('{"success":1,"go":"home.php"}');
				}
			}
			die('{"success":0,"err":"invalid_login"}');
		}
	}
	if (isset($_POST['register'])) {
		$userfirstname  = $_POST['userfirstname'];
		$userlastname   = $_POST['userlastname'];
		$usernickname   = $_POST['usernickname'];
		$userpassword   = password_hash($_POST['userpass'], PASSWORD_DEFAULT);
		$useremail      = $_POST['useremail'];
		$userbirthdate  = strtotime($_POST['birthday']);
		$usergender     = $_POST['usergender'];
		$userabout      = '';
		$user_token     = _generate_token();
		$usergender 	= in_array($usergender,["F","M","U"]) ? $usergender : "U";
		if(!validateDate($_POST['birthday'])) die('{"success":0,"err":"invalid_date"}');
		if(!_is_username_valid($usernickname)) die('{"success":0,"err":"invalid_nickname"}');
		if(!filter_var($email, FILTER_VALIDATE_EMAIL)) die('{"success":0,"err":"invalid_email"}');
			
		$userstatus = isset($_POST['userstatus']) ? $_POST['userstatus'] : 'U';
		
		$query = $conn->query(
			sprintf(
				"SELECT user_nickname, user_email FROM users WHERE user_nickname LIKE '%s' OR user_email LIKE '%s'",
				$conn->real_escape_string($usernickname),
				$conn->real_escape_string($useremail)
			)
		);
		if($query->num_rows > 0){
			$row = $query->fetch_assoc();
			if(strtolower($usernickname) == strtolower($row['user_nickname']) && !empty($usernickname)){
				die('{"success":0,"err":"exist_nickname"}');
			}
			if(strtolower($useremail) == strtolower($row['user_email'])){
				die('{"success":0,"err":"exist_email"}');
			}
		}else{
			$sql = 
			sprintf(
				"INSERT INTO users(user_firstname, user_lastname, user_nickname, user_password, user_email, user_gender, user_birthdate, user_about, user_token, user_create_date) VALUES ('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', %d)",
				$conn->real_escape_string($userfirstname),
				$conn->real_escape_string($userlastname),
				$conn->real_escape_string($usernickname),
				$conn->real_escape_string($userpassword),
				$conn->real_escape_string($useremail),
				$conn->real_escape_string($usergender),
				$conn->real_escape_string($userbirthdate),
				$conn->real_escape_string($userabout),
				$conn->real_escape_string($user_token),
				time()
			);
			$query = $conn->query($sql);
			$link = (isset($_SERVER["HTTPS"]) ? 'https' : 'http')."://". $_SERVER['SERVER_NAME'].'/verify.php?t=verify&user_email='.htmlspecialchars($useremail).'&username='.htmlspecialchars($usernickname).'&h='.hash('sha256',($userpassword.$user_token));
			SendVerifyMail($useremail,"$userfirstname $userlastname",$link);
			if($query){
				die('{"success":1,"go":"verify.php?t=registered"}');
			}
		}
	}
}
?>