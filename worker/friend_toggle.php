<?php
if (!isset($_COOKIE['token']))
	header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
	header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
if(isset($_GET['id']) && $_GET['id'] != $data['user_id'] && is_numeric($_GET['id'])) {
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
if(!is_numeric($current_id))
	header("Location:?id=1");
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	if($flag == 1){
		if (isset($_POST['request'])){
			if($data['user_id'] != $current_id)
				$check = $conn->query("SELECT * FROM friendship WHERE user1_id = {$data['user_id']} AND user2_id = $current_id");
				if($check->num_rows == 0)
					$sql3 = "INSERT INTO friendship(user1_id, user2_id, friendship_status) VALUES ({$data['user_id']}, $current_id, 0)";
		}elseif(isset($_POST['remove'])){
			$sql3 = "DELETE FROM friendship
					 WHERE ((friendship.user1_id = $current_id AND friendship.user2_id = {$data['user_id']})
					 OR (friendship.user1_id = {$data['user_id']} AND friendship.user2_id = $current_id))";
		}
		if(isset($sql3))
			$query3 = $conn->query($sql3);
		echo '{"success":1}';
	}else{
		echo '{"success":0}';
	}
}
?>