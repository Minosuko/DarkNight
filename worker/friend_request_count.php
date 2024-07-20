<?php
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
$data = _get_data_from_token($_COOKIE['token']);
$sql = "SELECT COUNT(*) AS count FROM friendship WHERE friendship.user2_id = {$data['user_id']} AND friendship.friendship_status = 0";
$query = $conn->query($sql);
echo $query->fetch_assoc()['count'];
?>