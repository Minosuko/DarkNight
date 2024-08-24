<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
	die('{"success":-1}');
$data = _get_data_from_token();
header("content-type: application/json");
if(!isset($_POST['email'])) die('{"success":-1}');
$email = $_POST['email'];
echo('{"success":1,"code":'.(filter_var($email, FILTER_VALIDATE_EMAIL) ? (email_exists($email) ? 1 : 0) : 2).'}');
?>