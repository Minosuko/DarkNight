<?php 
if (!isset($_COOKIE['token']))
	header("location:index.php");
require_once 'includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
	header("location:index.php");
$data = _get_data_from_token($_COOKIE['token']);
if(isset($_GET['id']) && $_GET['id'] != $data['user_id']) {
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
$data = _get_data_from_token($_COOKIE['token']);
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Social Network</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
		<link rel="stylesheet" type="text/css" href="resources/css/highlight/highlight.css">
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
		<style>
			.profile{
				background-color: transparrent;
				width: 220px;
				padding: 20px;
				color: white;
				border-radius: 15px;
			}
			.profile img{
				object-fit: contain;
				background-color: #ffffff;
				border-radius: 25%;
			}
			input[type="file"]{
				display: none;
			}
			label.upload{
				cursor: pointer;
				color: white;
				background-color: #4267b2;
				padding: 8px 12px;
				display: inline-block;
				max-width: 80px;
				overflow: auto;
			}
			label.upload:hover{
				background-color: #23385f;
			}
			.changeprofile{
				color: #23385f;
			}
			.profile_head{
				margin-top: 250px;
				margin-left: 150px;
				width: 100%;
			}
			#feed>.post{
				margin-right: 20%;
			}
			.about_me{
				margin-left: calc(70%);
				width: 400px;
				border-top: 1px solid rgba(255, 255, 255, 0.34);
				border-bottom: 1px solid rgba(255, 255, 255, 0.34);
				border-left: 60px solid transparent;
				border-right: 60px solid transparent;
				border-radius: 30px;
				backdrop-filter: blur(3.7px);
				-webkit-backdrop-filter: blur(3.7px);
			}
			#feed{
				margin-top: -200px;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<?php include 'includes/navbar.php'; ?>
			<input type="hidden" id="page" value="0">
			<div class="profile_cover" id="profile_cover">
			</div>
			<div id="custom_style"></div>
			<div class="profile" id="profile"></div>
			<div id="feed">
			</div>
		</div>
	</body>
	<script>
	fetch_profile("fetch_profile_info.php<?php if($current_id != $data['user_id']) echo "?id=$current_id"; ?>");
	fetch_post("fetch_profile_post.php<?php if($current_id != $data['user_id']) echo "?id=$current_id"; ?>");
	function showPath(){
		var path = document.getElementById("selectedFile").value;
		path = path.replace(/^.*\\/, "");
		document.getElementById("path").innerHTML = path;
	}
	function validateNumber(){
		var number = document.getElementById("phonenum").value;
		var required = document.getElementsByClassName("required");
		if(number == ""){
			required[0].innerHTML = "You must type Your Number.";
			return false;
		} else if(isNaN(number)){
			required[0].innerHTML = "Phone Number must contain digits only."
			return false;
		}
		return true;
	}
	</script>
</html>
