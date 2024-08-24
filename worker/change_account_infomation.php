<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
$data = _get_data_from_token();
header("content-type: application/json");
if($_SERVER['REQUEST_METHOD'] == 'POST') {
	if(!isset($_POST['type'])) die('{"success":-1}');
	$type = $_POST['type'];
	switch($type){
		case 'ChangePassword':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewPassword']) && !isset($_POST['VerifyPassword']) && !isset($_POST['LogAllsDevice']))
				die('{"success":-1}');
			$CurrentPassword = $_POST['CurrentPassword'];
			$NewPassword = $_POST['NewPassword'];
			$VerifyPassword = $_POST['VerifyPassword'];
			$LogAllsDevice = $_POST['LogAllsDevice'];
			if($NewPassword != $VerifyPassword) die('{"success":0,"code":0}');
			if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
			$hashPassword = password_hash($NewPassword, PASSWORD_DEFAULT);
			$sql = "UPDATE users SET user_password = '$hashPassword' WHERE user_id = {$data['user_id']}";
			if($LogAllsDevice == 1){
				$esql = sprintf(
					"DELETE FROM session WHERE user_id = %d AND session_id != '%s'",
					$data['user_id'],
					$conn->real_escape_string($_COOKIE['session_id'])
				);
				$conn->query($esql);
			}
			$conn->query($sql);
			echo '{"success":1}';
			break;
		case 'ChangeUsername':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewUsername']))
				die('{"success":-1}');
			$CurrentPassword = $_POST['CurrentPassword'];
			$NewUsername = $_POST['NewUsername'];
			if(!_is_username_valid($NewUsername)) die('{"success":0,"code":0}');
			if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
			if(username_exists($NewUsername)) die('{"success":0,"code":2}');
			if($data['last_username_change'] != 0)
				if(time() - $data['last_username_change'] < (86400*90))
					die('{"success":0,"code":3}');
			$time = time();
			$sql = "UPDATE users SET user_password = '$NewUsername', last_username_change = $time WHERE user_id = {$data['user_id']}";
			$conn->query($sql);
			echo '{"success":1}';
			break;
		case 'ChangeEmail':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewEmail']) && !isset($_POST['VerifyCode']))
				die('{"success":-1}');
			$CurrentPassword = $_POST['CurrentPassword'];
			$NewEmail = $_POST['NewEmail'];
			$VerifyCode = $_POST['VerifyCode'];
			if(!filter_var($NewEmail, FILTER_VALIDATE_EMAIL)) die('{"success":0,"code":0}');
			if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
			if(email_exists($NewEmail)) die('{"success":0,"code":2}');
			$timeSlice = floor(time() / 900);
			$code = substr(hash("sha256",lunar_hash(strtolower($NewEmail).$data['user_email'].$data['user_password'].$data['user_token'].$timeSlice)),0,8);
			if($VerifyCode != $code) die('{"success":0,"code":3}');
			$sql = sprintf(
				"UPDATE users SET user_email = '%s' WHERE user_id = %d",
				$conn->real_escape_string($NewEmail),
				$data['user_id']
			);
			$conn->query($sql);
			echo '{"success":1}';
			break;
		case 'RequestEmailCode':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewEmail']))
				die('{"success":-1}');
			$CurrentPassword = $_POST['CurrentPassword'];
			$NewEmail = $_POST['NewEmail'];
			if(!filter_var($NewEmail, FILTER_VALIDATE_EMAIL)) die('{"success":0,"code":0}');
			if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
			if(email_exists($NewEmail)) die('{"success":0,"code":2}');
			$name = "{$data['user_firstname']} {$data['user_lastname']}";
			$timeSlice = floor(time() / 900);
			$code = substr(hash("sha256",lunar_hash(strtolower($NewEmail).$data['user_email'].$data['user_password'].$data['user_token'].$timeSlice)),0,8);
			$MailBody = '<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<style>
			.title{
				text-align: center;
				color: #4d94ff;
				font-size: 500%;
			}
			p{
				color: white;
				margin: 0;
				font-size: 180%;
			}
			a{
				color: cyan;
				margin: 0;
				text-decoration:none;
				font-size: 180%;
			}
			b{
				color: #4d94ff;
				font-size: 200%;
			}
			body{
				font-family: Roboto;
			}
			.context{
				background-color: #121212;
				width: 90%;
				height: 100%;
				padding: 50px;
				margin: auto;
			}
			.content{
				width: 60%;
				display: block;
				margin-top: 15%;
				margin: auto;
				position: realtive;
				padding: 10px;
				background-color: #1b1d26;
				border-radius: 15px;
			}
			.code{
				background-color: #3f3f3f;
			}
		</style>
	</head>
	<body>
		<div class="context">
			<p class="title">Darknight Social</p>
			<div class="container">
				<div class="transparent_block">
					<div class="content">
						<p>Hello '.$name.',</p>
						<p>Seem like you want to change your email addess</p>
						<br>
						<p>Your verification code is <span class="code">'.$code.'</span>, this code valid for 15 minutes</p>
						<br>
						<br>
						<p>If you didn’t ask to change your email, you can ignore this email.</p>
						<br>
						<center><b>- DarkNightDev - </b></center>
					</div>
				</div>
			</div>
		</div>
	</body>
</html>';
			$Mailer->send(
				$NewEmail,
				"DarkNight - Change email",
				$MailBody,
				['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]
			);
			echo '{"success":1}';
			break;
		default:
			echo '{"success":-1}';
			break;
	}
}
?>