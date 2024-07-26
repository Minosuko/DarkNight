<?php
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token($_COOKIE['token']);
$id = -1;
if(isset($_GET['id']))
	if(is_numeric($_GET['id']))
		$id = $_GET['id'];
$sql = "SELECT posts.post_caption, posts.post_time, posts.post_public, users.user_firstname, users.user_lastname, users.user_id, users.user_gender, posts.post_id, posts.post_media, posts.is_share, users.pfp_media_id, users.user_nickname, users.verified FROM posts JOIN users ON posts.post_by = users.user_id WHERE (posts.post_public = 2 OR users.user_id = {$data['user_id']}) AND posts.post_id = $id UNION SELECT posts.post_caption, posts.post_time, posts.post_public, users.user_firstname, users.user_lastname, users.user_id, users.user_gender, posts.post_id, posts.post_media, posts.is_share, users.pfp_media_id, users.user_nickname, users.verified FROM posts JOIN users ON posts.post_by = users.user_id JOIN (SELECT friendship.user1_id AS user_id FROM friendship WHERE friendship.user2_id = {$data['user_id']} AND friendship.friendship_status = 1 UNION SELECT friendship.user2_id AS user_id FROM friendship WHERE friendship.user1_id = {$data['user_id']} AND friendship.friendship_status = 1) userfriends ON userfriends.user_id = posts.post_by WHERE posts.post_public >= 1";
$query = $conn->query($sql);
$total_rows = $query->num_rows;
if($total_rows == 0){
	echo '{"success":2}';
}else{
	$rows = $query->fetch_all(MYSQLI_ASSOC);
	$row_d = $rows[0];
	$row_d["is_liked"] = is_liked($data['user_id'], $row_d['post_id']) ? 1 : 0;
	$row_d["total_like"] = total_like($row_d['post_id']);
	$row_d["total_comment"] = total_comment($row_d['post_id']);
	$row_d["total_share"] = total_share($row_d['post_id']);
	$row_d["post_caption"] = _caption_trim($row_d['post_caption']);
	if($row_d['post_media'] != 0){
		$row_d["media_hash"] = _get_hash_from_media_id($row_d['post_media']);
		$row_d["is_video"] = _is_video($row_d['post_media']);
		$row_d["media_format"] = _media_format($row_d['post_media']);
	}
	if($row_d['pfp_media_id'] != 0)
		$row_d["pfp_media_hash"] = _get_hash_from_media_id($row_d['pfp_media_id']);
	if($row_d['is_share'] != 0){
		$sql = "SELECT * FROM posts WHERE post_id = {$row_d['is_share']}";
		$query = $conn->query($sql);
		$post_data = $query->fetch_assoc();
		$pflag = false;
		if($post_data['post_public'] == "0" or $post_data['post_public'] == "1"){
			if($post_data['post_by'] == $data['user_id']){
				$pflag = true;
			}else{
				if($post_data['post_public'] == "1")
					if(is_friend($data['user_id'], $post_data['post_by']))
						$pflag = true;
				if($post_data['post_public'] == "0")
					if($data['user_id'] == $post_data['post_by'])
						$pflag = true;
			}
		}else{
			$pflag = true;
		}
		$sdata = _get_data_from_id($post_data['post_by']);
		$row_d['share'] = [];
		$row_d['share']['pflag'] = $pflag;
		$row_d['share']['post_by'] = $post_data['post_by'];
		$row_d['share']['post_public'] = $post_data['post_public'];
		$row_d['share']['user_id'] = $sdata['user_id'];
		$row_d['share']['pfp_media_id'] = $sdata['pfp_media_id'];
		$row_d['share']['user_firstname'] = $sdata['user_firstname'];
		$row_d['share']['user_lastname'] = $sdata['user_lastname'];
		$row_d['share']['post_caption'] = _caption_trim($post_data['post_caption']);
		$row_d['share']['post_time'] = $post_data['post_time'];
		$row_d['share']['post_media'] = $post_data['post_media'];
		if($row_d['share']['post_media'] != 0){
			$row_d['share']["is_video"] = _is_video($post_data['post_media']);
			$row_d['share']["media_hash"] = _get_hash_from_media_id($post_data['post_media']);
			$row_d['share']["media_format"] = _media_format($post_data['post_media']);
		}
		if($row_d['share']['pfp_media_id'] != 0)
			$row_d['share']["pfp_media_hash"] = _get_hash_from_media_id($row_d['share']['pfp_media_id']);
	}
	$row_d["success"] = 1;
	echo json_encode($row_d);
}
?>