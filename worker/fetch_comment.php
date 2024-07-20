<?php
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token($_COOKIE['token']);
$off = 0;
$id = -1;
$esql = '';
if(isset($_GET['id']))
	if(is_numeric($_GET['id']))
		$id = $_GET['id'];
if(isset($_GET['page']))
	if(is_numeric($_GET['page']))
		$off = 10*$_GET['page'];
if($off != 0)
	$esql = " OFFSET $off";
$sql = "SELECT comments.post_id, comments.comment, comments.comment_time, comments.user_id, users.pfp_media_id, users.user_nickname, users.user_firstname, users.user_lastname, users.user_id, users.user_gender, users.verified FROM comments JOIN users ON comments.user_id = users.user_id WHERE comments.post_id = $id ORDER BY comment_time LIMIT 10$esql";
$query = $conn->query($sql);
$total_rows = $query->num_rows;
if($total_rows == 0){
	echo '{"success":2}';
}else{
	$width = '40px'; // Profile Image Dimensions
	$height = '40px';
	$r = 10;
	if($total_rows < 10)
		$r = $total_rows;
	$rows = $query->fetch_all(MYSQLI_ASSOC);
	$row_d = [];
	for($i = 0; $i < $r; $i++){
		$row_d[$i] = $rows[$i];
		if($row_d[$i]['pfp_media_id'] != 0)
			$row_d[$i]["pfp_media_hash"] = _get_hash_from_media_id($row_d[$i]['pfp_media_id']);
	}
	$row_d["success"] = 1;
	echo json_encode($row_d);
}
?>