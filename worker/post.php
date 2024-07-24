<?php
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
$data = _get_data_from_token($_COOKIE['token']);
if($_SERVER['REQUEST_METHOD'] == 'POST') {
	if(isset($_POST['private']) && isset($_POST['caption'])){
		$caption = $_POST['caption'];
		if($_POST['private'] == "0")
			$public = 0;
		elseif($_POST['private'] == "1")
			$public = 1;
		else
			$public = 2;
		$query = false;
		$poster = $data['user_id'];
		$sql = sprintf(
			"INSERT INTO posts (post_caption, post_public, post_time, post_by) VALUES ('%s', '$public', $timestamp, $poster)",
			$conn->real_escape_string($caption)
		);
		if(isset($_FILES['fileUpload']) || !empty($_POST['caption']))
			$query = $conn->query($sql);
		if($query){
			if (isset($_FILES['fileUpload'])) {
				$last_id = $conn->insert_id;
				$filename = basename($_FILES["fileUpload"]["name"]);
				$filetype = pathinfo($filename, PATHINFO_EXTENSION);
				$supported_image = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];
				if(in_array(strtolower($filetype),$supported_image)){
					if(exif_imagetype($_FILES["fileUpload"]["tmp_name"])){
						$media_hash = md5_file($_FILES["fileUpload"]["tmp_name"]);
						$filepath = __DIR__ . "/../data/images/image/$media_hash.bin";
						$media_format = mime_content_type($_FILES["fileUpload"]["tmp_name"]);
						$sql = "SELECT * FROM media WHERE media_hash = '$media_hash'";
						$query = $conn->query($sql);
						if($query->num_rows == 0){
							$sql = "INSERT INTO media (media_format, media_hash, media_ext) VALUES ('$media_format','$media_hash', '$filetype')";
							$query = $conn->query($sql);
							$media_id = $conn->insert_id;
						}else{
							$media_id = $query6->fetch_assoc()["media_id"];
						}
					}
				}
				if(isset($last_id) && isset($media_id)){
					$sql = "UPDATE posts SET post_media = $media_id WHERE post_id = $last_id";
					$query = $conn->query($sql);
				}
				move_uploaded_file($_FILES["fileUpload"]["tmp_name"], $filepath);
			}
			echo "success";
		}
	}
}
?>