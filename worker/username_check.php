<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
	die('{"success":-1}');
$data = _get_data_from_token();
header("content-type: application/json");
if(!isset($_POST['username'])) die('{"success":-1}');
$username = $_POST['username'];
echo('{"success":1,"code":'.(_is_username_valid($username) ? (username_exists($username) ? 1 : 0) : 2).'}');
?>