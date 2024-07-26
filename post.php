<?php 
// Check whether user is logged on or not
if (!isset($_COOKIE['token']))
	header("location:index.php");
require_once 'includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
	header("location:index.php");
$data = _get_data_from_token($_COOKIE['token']);
if(isset($_GET['id'])){
	if(is_numeric($_GET['id']))
		$id = $_GET['id'];
	else
		header("location:home.php");
}else{
	header("location:home.php");
}
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
			.caption_box_shadow{
				width: 96.2%;
			}
			.caption_box pre{
				width: 100%;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<?php include 'includes/navbar.php'; ?>
			<input type="hidden" id="page" value="0">
			<div id="image_content">
				<center>
					<div class="left_content" id="_content_left">
						<img class="content-pic" id="picture" />
						<video class="content-vid" id="video" controls></video>
					</div>
				</center>
				<div class="right_content" id="_content_right">
					
				</div>
			</div>
		</div>
		<script>
			_load_post(<?php echo $id; ?>);
		</script>
	</body>
</html>