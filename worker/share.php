<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
$data = _get_data_from_token();
if(isset($_POST['post_id'])){
	$id = $_POST['post_id'];
	if(isset($_POST['private']) && isset($_POST['caption'])){
		$caption = $_POST['caption'];
		if($_POST['private'] == "N")
			$public = 1;
		else
			$public = 2;
		/*
			private     = 0
			friend only = 1
			public      = 2
		*/
		$poster = $data['user_id'];
		$sql = sprintf(
			"INSERT INTO posts (post_caption, post_public, post_time, post_by, is_share) VALUES ('%s', '$public', $timestamp, $poster, $id)",
			$conn->real_escape_string($caption)
		);
		$query = $conn->query($sql);
		if($query){
			if (isset($_FILES['fileUpload'])) {
				$last_id = $conn->insert_id;
				include '../functions/upload.php';
			}
			echo "success;";
		}
	}
	if(is_numeric($id)){
		if(is_post_exists($id)){
			$query = $conn->query("SELECT * FROM posts WHERE user_id = {$data['user_id']} AND is_share = $id");
			echo total_share($id);
		}
	}
}
?>