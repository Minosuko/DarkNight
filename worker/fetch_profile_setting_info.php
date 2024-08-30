<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
$sql = "SELECT user_id, user_nickname, user_gender, user_hometown, user_status, user_birthdate, user_firstname, user_lastname, pfp_media_id, cover_media_id, user_about, verified, user_create_date, user_email, last_username_change, online_status
		FROM users
		WHERE user_id = {$data['user_id']}";
$query = $conn->query($sql);
$total_rows = $query->num_rows;
if($total_rows == 0){
	echo '{"success":-1}';
}else{
	$rows = $query->fetch_all(MYSQLI_ASSOC);
	$row_d = $rows[0];
	if($row_d['pfp_media_id'] > 0)
		$row_d['pfp_media_hash'] = _get_hash_from_media_id($row_d['pfp_media_id']);
	if($row_d['cover_media_id'] > 0)
		$row_d['cover_media_hash'] = _get_hash_from_media_id($row_d['cover_media_id']);
	$row_d["user_about"] = htmlspecialchars($row_d['user_about']);
	$row_d["success"] = 1;
	echo json_encode($row_d);
}
?>