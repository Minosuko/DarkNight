<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
	header("location:../index.php");
$data = _get_data_from_token();
header("content-type: application/json");
if($_SERVER['REQUEST_METHOD'] == 'POST') {
	if(!isset($_POST['type'])) die('{"success":-1}');
	$type = $_POST['type'];
	$name = "{$data['user_firstname']} {$data['user_lastname']}";
	switch($type){
		case 'ChangePassword':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewPassword']) && !isset($_POST['VerifyPassword']) && !isset($_POST['LogAllsDevice']))
				die('{"success":-1}');
			$CurrentPassword = decryptPassword($_POST['CurrentPassword']);
			$NewPassword = decryptPassword($_POST['NewPassword']);
			$VerifyPassword = decryptPassword($_POST['VerifyPassword']);
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
			$MailBody = $GLOBALS['Mailer_Header']
			.'
						<p>Hello '.$name.',</p>
						<p>Seem like you changed your password</p>
						<br>
						<br>
						<p>If you didn’t change your password, reply via this email for support.</p>
						<br>
						<center><b>- DarkNightDev - </b></center>'
			.$GLOBALS['Mailer_Footer'];
			$Mailer->send(
				$NewEmail,
				"DarkNight - Password changed",
				$MailBody,
				['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]
			);
			echo '{"success":1}';
			break;
		case 'ChangeUsername':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewUsername']))
				die('{"success":-1}');
			$CurrentPassword = decryptPassword($_POST['CurrentPassword']);
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
			$MailBody = $GLOBALS['Mailer_Header']
			.'
						<p>Hello '.$name.',</p>
						<p>Seem like you changed your username</p>
						<br>
						<br>
						<p>Your new username is '.$NewUsername.'</p>
						<br>
						<center><b>- DarkNightDev - </b></center>'
			.$GLOBALS['Mailer_Footer'];
			$Mailer->send(
				$NewEmail,
				"DarkNight - Username changed",
				$MailBody,
				['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]
			);
			echo '{"success":1}';
			break;
		case 'ChangeEmail':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewEmail']) && !isset($_POST['VerifyCode']))
				die('{"success":-1}');
			$CurrentPassword = decryptPassword($_POST['CurrentPassword']);
			$NewEmail = $_POST['NewEmail'];
			$VerifyCode = $_POST['VerifyCode'];
			if(!filter_var($NewEmail, FILTER_VALIDATE_EMAIL)) die('{"success":0,"code":0}');
			if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
			if(email_exists($NewEmail)) die('{"success":0,"code":2}');
			$timeSlice = floor(time() / 900);
			$code = substr(hash("sha256",lunar_hash(strtolower($NewEmail).$data['user_email'].$data['user_password'].$data['user_create_date'].$timeSlice)),0,8);
			if($VerifyCode != $code) die('{"success":0,"code":3}');
			$sql = sprintf(
				"UPDATE users SET user_email = '%s' WHERE user_id = %d",
				$conn->real_escape_string($NewEmail),
				$data['user_id']
			);
			$conn->query($sql);
			$emailE = explode('@',$NewEmail);
			$MailBody = $GLOBALS['Mailer_Header']
			.'
						<p>Hello '.$name.',</p>
						<p>Seem like you changed your email addess to '.substr($NewEmail,0,3).'*****@'.$emailE[1].'</p>
						<br>
						<br>
						<p>If you didn’t change your email, reply via this email for support.</p>
						<br>
						<center><b>- DarkNightDev - </b></center>'
			.$GLOBALS['Mailer_Footer'];
			$Mailer->send(
				$NewEmail,
				"DarkNight - Email changed",
				$MailBody,
				['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]
			);
			echo '{"success":1}';
			break;
		case 'RequestEmailCode':
			if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewEmail']))
				die('{"success":-1}');
			$CurrentPassword = decryptPassword($_POST['CurrentPassword']);
			$NewEmail = $_POST['NewEmail'];
			if(!filter_var($NewEmail, FILTER_VALIDATE_EMAIL)) die('{"success":0,"code":0}');
			if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
			if(email_exists($NewEmail)) die('{"success":0,"code":2}');
			$timeSlice = floor(time() / 900);
			$code = substr(hash("sha256",lunar_hash(strtolower($NewEmail).$data['user_email'].$data['user_password'].$data['user_create_date'].$timeSlice)),0,8);
			$MailBody = $GLOBALS['Mailer_Header']
			.'
						<p>Hello '.$name.',</p>
						<p>Seem like you want to change your email addess</p>
						<br>
						<p>Your verification code is <span class="code">'.$code.'</span>, this code valid for few minutes</p>
						<br>
						<br>
						<p>If you didn’t ask to change your email, you can ignore this email.</p>
						<br>
						<center><b>- DarkNightDev - </b></center>'
			.$GLOBALS['Mailer_Footer'];
			$Mailer->send(
				$NewEmail,
				"DarkNight - Change email request",
				$MailBody,
				['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]
			);
			echo '{"success":1}';
			break;
		case 'ChangePofileInfomation':
			if(!isset($_POST['userfirstname']) && !isset($_POST['userlastname']) && !isset($_POST['userlastname']) && !isset($_POST['birthday']) && !isset($_POST['usergender']) && !isset($_POST['userhometown']) && !isset($_POST['userabout']))
				die('{"success":-1}');
			$userfirstname	= str_replace([' ','	',"\r","\n"],'',trim($_POST['userfirstname']));
			$userlastname	= str_replace([' ','	',"\r","\n"],'',trim($_POST['userlastname']));
			$usergender		= $_POST['usergender'];
			$userhometown	= $_POST['userhometown'];
			$userabout		= $_POST['userabout'];
			if(empty($userfirstname)) die('{"success":0,"code":0}');
			if(empty($userlastname)) die('{"success":0,"code":0}');
			if(strlen($userhometown) > 255) die('{"success":0,"code":1}');
			if(!validateDate($_POST['birthday'])) die('{"success":0,"code":2}');
			$userbirthdate	= strtotime($_POST['birthday']);
			$usergender		= in_array($usergender,["F","M","U"]) ? $usergender : "U";
			$sql = sprintf(
				"UPDATE users SET user_birthdate = %d, user_firstname = '%s', user_lastname = '%s', user_gender = '%s', user_hometown = '%s', user_about = '%s'  WHERE user_id = %d",
				$userbirthdate,
				$conn->real_escape_string($userfirstname),
				$conn->real_escape_string($userlastname),
				$usergender,
				$conn->real_escape_string($userhometown),
				$conn->real_escape_string($userabout),
				$data['user_id']
			);
			$conn->query($sql);
			echo '{"success":1}';
			break;
		default:
			echo '{"success":-1}';
			break;
	}
}
?>