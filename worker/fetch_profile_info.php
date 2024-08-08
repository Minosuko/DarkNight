<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
if(isset($_GET['id']) && $_GET['id'] != $data['user_id']) {
	$current_id = $conn->real_escape_string($_GET['id']);
	$flag = 1;
} else {
	$current_id = $data['user_id'];
	$flag = 0;
}
if(!is_user_exists($current_id)){
	$current_id = $data['user_id'];
	$flag = 0;
}
if($flag == 0) {
	$profilesql = "SELECT users.user_id, users.user_nickname, users.user_gender, users.user_hometown, users.user_status, users.user_birthdate, users.user_firstname, users.user_lastname, users.pfp_media_id, users.cover_media_id, users.user_about, users.verified
				  FROM users
				  WHERE users.user_id = $current_id";
} else {
	$profilesql = "SELECT users.user_id, users.user_nickname, users.user_gender, users.user_hometown, users.user_status, users.user_birthdate, users.user_firstname, users.user_lastname, userfriends.friendship_status, users.pfp_media_id, users.cover_media_id, users.user_about, users.verified
					FROM users
					LEFT JOIN (
						SELECT friendship.user1_id AS user_id, friendship.friendship_status
						FROM friendship
						WHERE friendship.user1_id = $current_id AND friendship.user2_id = {$data['user_id']}
						UNION
						SELECT friendship.user2_id AS user_id, friendship.friendship_status
						FROM friendship
						WHERE friendship.user1_id = {$data['user_id']} AND friendship.user2_id = $current_id
					) userfriends
					ON userfriends.user_id = users.user_id
					WHERE users.user_id = $current_id";
}
$sql = "$profilesql";
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
	$row_d["friendship_status"] = isset($row_d['friendship_status']) ? $row_d['friendship_status'] : null;
	$row_d["user_about"] = _about_trim($row_d['user_about']);
	$row_d["flag"] = $flag;
	$row_d["success"] = 1;
	echo json_encode($row_d);
}
?>
