<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
$sql = "SELECT users.user_id, users.user_firstname, users.user_lastname, users.user_gender, users.pfp_media_id, users.user_nickname, users.verified
		FROM users
		JOIN (
			SELECT friendship.user1_id AS user_id
			FROM friendship
			WHERE friendship.user2_id = {$data['user_id']} AND friendship.friendship_status = 1
			UNION
			SELECT friendship.user2_id AS user_id
			FROM friendship
			WHERE friendship.user1_id = {$data['user_id']} AND friendship.friendship_status = 1
		) userfriends
		ON userfriends.user_id = users.user_id DESC LIMIT 20";
$off = 0;
$esql = '';
if(isset($_GET['page']))
	if(is_numeric($_GET['page']))
		$off = 20*$_GET['page'];
if($off != 0)
	$esql = " OFFSET $off";
$sql = "$sql$esql";
$query = $conn->query($sql);
$total_rows = $query->num_rows;
if($total_rows == 0){
	echo '{"success":' . (($off >= 20) ? '3' : 2) . '}';
}else{
	$r = 20;
	if($total_rows < 20)
		$r = $total_rows;
	$rows = $query->fetch_all(MYSQLI_ASSOC);
	$row_d = [];
	for($i = 0; $i < $r; $i++){
		$row_d[$i] = $rows[$i];
		$LastOnline = _get_last_online($row_d[$i]['user_id']);
		if($row_d[$i]['pfp_media_id'] > 0)
			$row_d[$i]['pfp_media_hash'] = _get_hash_from_media_id($row_d[$i]['pfp_media_id']);
		$row_d[$i]['is_online'] = (time() - $LastOnline <= 600) ? 1 : 0;
		$row_d[$i]['last_online'] = $LastOnline;
	}
	$row_d["success"] = 1;
	echo json_encode($row_d);
}
?>