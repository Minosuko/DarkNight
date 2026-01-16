<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    die(0);
$data = _get_data_from_token();
if($data['online_status'] == 1 && isset($_COOKIE['session_id']))
	$query = $conn->query("UPDATE session SET last_online = $timestamp WHERE user_id = {$data['user_id']} AND session_id = {$_COOKIE['session_id']}");
echo 1;
?>