<?php
// Check whether user is logged on or not
if (!isset($_COOKIE['token']))
    header("location:../index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:../index.php");
$data = _get_data_from_token($_COOKIE['token']);
if($_SERVER['REQUEST_METHOD'] == 'POST') {
	if(isset($_FILES['fileUpload']) && isset($_POST['type'])){
		$type = $_POST['type'];
		$filename = basename($_FILES["fileUpload"]["name"]);
		$filetype = pathinfo($filename, PATHINFO_EXTENSION);
		$supported_image = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];
		if(in_array($type,['cover','profile'])){
			if(in_array($filetype,$supported_image)){
				if(exif_imagetype($_FILES["fileUpload"]["tmp_name"])){
					$media_hash = md5_file($_FILES["fileUpload"]["tmp_name"]);
					$filepath = __DIR__ . "/../data/images/image/$media_hash.bin";
					$media_format = mime_content_type($_FILES["fileUpload"]["tmp_name"]);
					$sql6 = "SELECT * FROM media WHERE media_hash = '$media_hash'";
					$query6 = $conn->query($sql6);
					if($query6->num_rows == 0){
						$sql6 = "INSERT INTO media (media_format, media_hash, media_ext) VALUES ('$media_format','$media_hash', '$filetype')";
						$query6 = $conn->query($sql6);
						$media_id = $conn->insert_id;
					}else{
						$media_id = $query6->fetch_assoc()["media_id"];
					}
				}
			}
			if($type == 'profile'){
				$success = 0;
				if(move_uploaded_file($_FILES["fileUpload"]["tmp_name"], $filepath)){
					$sql5 = sprintf("INSERT INTO posts (post_caption, post_public, post_time, post_by, post_media) VALUES ('%s has changed profile picture.', 2, $timestamp, {$data['user_id']}, $media_id)",
						$conn->real_escape_string("{$data['user_firstname']} {$data['user_lastname']}"),
					);
					$query5 = $conn->query($sql5);
					$sql7 = "UPDATE users SET pfp_media_id = $media_id WHERE user_id = {$data['user_id']}";
					$query7 = $conn->query($sql7);
				}
			}
			if($type == 'cover'){
				$success = 0;
				if(move_uploaded_file($_FILES["fileUpload"]["tmp_name"], $filepath)){
					$sql5 = sprintf("INSERT INTO posts (post_caption, post_public, post_time, post_by, post_media) VALUES ('%s has changed cover picture.', 2, $timestamp, {$data['user_id']}, $media_id)",
						$conn->real_escape_string("{$data['user_firstname']} {$data['user_lastname']}"),
					);
					$query5 = $conn->query($sql5);
					$sql7 = "UPDATE users SET cover_media_id = $media_id WHERE user_id = {$data['user_id']}";
					$query7 = $conn->query($sql7);
				}
			}
			echo "success";
		}
	}
}
?>
