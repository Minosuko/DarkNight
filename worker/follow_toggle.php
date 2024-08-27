<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
	header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	if(isset($_POST['id']) && $_POST['id'] != $data['user_id']) {
		$id = $conn->real_escape_string($_POST['id']);
	} else {
		die('{"success":-1}');
	}
	if(!is_numeric($current_id))
		die('{"success":-1}');
	if(is_follow($id,$data['user_id']))
		$sql = "DELETE FROM `follows` `user1_id` = {$data['user_id']} AND `user2_id` = $id";
	else
		$sql = "INSERT INTO `follows` (`user1_id`, `user2_id`) VALUES ({$data['user_id']}, $id)";
	$query = $conn->query($sql);
	echo '{"success":1}';
}
?>