<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
$data = _get_data_from_token();
header("content-type: application/json");
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
			$upload_allowed = false;
			if (isset($_FILES['fileUpload'])) {
				$last_id = $conn->insert_id;
				$filename = basename($_FILES["fileUpload"]["name"]);
				$filetype = pathinfo($filename, PATHINFO_EXTENSION);
				$supported_ext = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "webm", "mp4", "mpeg"];
				if(in_array(strtolower($filetype),$supported_ext)){
					$media_hash = md5_file($_FILES["fileUpload"]["tmp_name"]);
					$media_format = mime_content_type($_FILES["fileUpload"]["tmp_name"]);
					if(exif_imagetype($_FILES["fileUpload"]["tmp_name"])){
						$mediatype = 0;
						$filepath = __DIR__ . "/../data/images/image/$media_hash.bin";
						$upload_allowed = true;
					}elseif(exif_videotype($_FILES["fileUpload"]["tmp_name"])){
						$filepath = __DIR__ . "/../data/videos/video/$media_hash.bin";
						$upload_allowed = true;
						$mediatype = 1;
					}
					if($upload_allowed){
						$sql = "SELECT * FROM media WHERE media_hash = '$media_hash'";
						$query = $conn->query($sql);
						if($query->num_rows == 0){
							$sql = "INSERT INTO media (media_format, media_hash, media_ext) VALUES ('$media_format','$media_hash', '$filetype')";
							$query = $conn->query($sql);
							$media_id = $conn->insert_id;
						}else{
							$media_id = $query6->fetch_assoc()["media_id"];
						}
						move_uploaded_file($_FILES["fileUpload"]["tmp_name"], $filepath);
					}
				}
				if(isset($last_id) && isset($media_id)){
					$sql = "UPDATE posts SET post_media = $media_id WHERE post_id = $last_id";
					$query = $conn->query($sql);
				}
			}
			$response = [];
			$response['success'] = 1;
			$response['post_id'] = $last_id;
			$response['has_media'] = $upload_allowed;
			if($upload_allowed){
				$response['media_type'] = $mediatype;
				$response['media_id'] = $media_id;
				$response['media_hash'] = $media_hash;
			}
			echo json_encode($response);
		}
	}
}
?>
