<?php
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
$data = _get_data_from_token($_COOKIE['token']);
if(isset($_GET['post_id'])){
	$id = $_GET['post_id'];
	if(is_numeric($id)){
		if(is_post_exists($id)){
			$query = $conn->query("SELECT * FROM likes WHERE user_id = {$data['user_id']} AND post_id = $id");
			if($query->num_rows > 0){
				$query = $conn->query("DELETE FROM likes WHERE user_id = {$data['user_id']} AND post_id = $id");
				echo "0;".total_like($id);
			}else{
				$query = $conn->query("INSERT INTO likes (user_id, post_id) VALUES ({$data['user_id']}, $id)");
				echo "1;".total_like($id);
			}
		}
	}
}
?>