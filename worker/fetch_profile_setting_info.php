<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
$sql = "SELECT users.user_id, users.user_nickname, users.user_gender, users.user_hometown, users.user_status, users.user_birthdate, users.user_firstname, users.user_lastname, users.pfp_media_id, users.cover_media_id, users.user_about, users.verified, users.user_create_date, users.user_email, users.last_username_change
		FROM users
		WHERE users.user_id = {$data['user_id']}";
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
	$row_d["user_about"] = _about_trim($row_d['user_about']);
	$row_d["success"] = 1;
	echo json_encode($row_d);
}
?>