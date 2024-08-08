<?php 
if (!isset($_COOKIE['token']))
	header("location:index.php");
require_once 'includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
	header("location:index.php");
$data = _get_data_from_token();
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
		<link rel="stylesheet" type="text/css" href="resources/css/highlight/highlight.css">
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
	</head>
	<body>
		<?php include 'includes/navbar.php'; ?>
		<div class="container">
			<br>
			<input type="hidden" id="page" value="0">
			<div class="createpost_box">
				<div>
					<a href="/profile.php" title="Profiles">
					<img class="pfp" src="data/blank.jpg" width="40px" height="40px" id="pfp_box">
					</a>
					<div class="input_box" onclick="make_post()">
						<a>Post something...</a>
					</div>
				</div>
			</div>
			<br>
			<div id="feed">
			</div>
			<br><br><br>
		</div>
		<script>
			fetch_post("fetch_post.php");
		</script>
	</body>
</html>