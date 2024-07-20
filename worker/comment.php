<?php
// Check whether user is logged on or not
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
$data = _get_data_from_token($_COOKIE['token']);
if(isset($_GET['id'])){
	if(is_numeric($_GET['id'])){
		if(isset($_POST['comment']) && isset($_GET['id'])){
			$comment = $_POST['comment'];
			$post_id = $_GET['id'];
			$user_id = $data['user_id'];
			$sql = sprintf(
				"INSERT INTO `comments` (`post_id`, `user_id`, `comment`, `comment_time`) VALUES ('$post_id', '$user_id', '$comment', '$timestamp')",
				$conn->real_escape_string($comment)
			);
			$query = $conn->query($sql);
			if($query){
				//if (isset($_FILES['fileUpload'])) {
				//	$last_id = $conn->insert_id;
				//	include '../functions/upload.php';
				//}
				echo '{"success":1}';
			}
		}
	}
}
?>