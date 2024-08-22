<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
$data = _get_data_from_token();
header("content-type: application/json");
if($_SERVER['REQUEST_METHOD'] == 'POST') {
	!isset($_POST['type']) ?? die('{"success":-1}');
	$type = $_POST['type'];
	switch($type){
		case 'ChangePassword':
			(!isset($_POST['CurrentPassword']) && !isset($_POST['NewPassword']) && !isset($_POST['VerifyPassword'])) ?? die('{"success":-1}');
			$CurrentPassword = $_POST['CurrentPassword'];
			$NewPassword = $_POST['NewPassword'];
			$VerifyPassword = $_POST['VerifyPassword'];
			($NewPassword != $VerifyPassword) ?? die('{"success":0,"code":0}');
			!password_verify($CurrentPassword, $data['user_password']) ?? die('{"success":0,"code":1}');
			$hashPassword = password_hash($NewPassword, PASSWORD_DEFAULT);
			$sql = "UPDATE users SET user_password = '$hashPassword' WHERE user_id = {$data['user_id']}";
			echo '{"success":1}';
			break;
		case 'ChangeUsername':
			(!isset($_POST['CurrentPassword']) && !isset($_POST['NewUsername'])) ?? die('{"success":-1}');
			$CurrentPassword = $_POST['CurrentPassword'];
			$NewUsername = $_POST['NewUsername'];
			!_is_username_valid($NewUsername) ?? die('{"success":0,"code":0}');
			!password_verify($CurrentPassword, $data['user_password']) ?? die('{"success":0,"code":1}');
			$sql = "UPDATE users SET user_password = '$NewUsername' WHERE user_id = {$data['user_id']}";
			echo '{"success":1}';
			break;
		default:
			echo '{"success":-1}';
			break;
	}
}
?>