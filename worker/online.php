<?php
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
$data = _get_data_from_token($_COOKIE['token']);
$query = $conn->query("UPDATE users SET last_online = $timestamp WHERE user_id = {$data['user_id']}");
echo 1;
?>