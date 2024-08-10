<?php 
require_once 'includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
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
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
		<style>
		.frame a{
			text-decoration: none;
		}
		.frame a:hover{
			text-decoration: underline;
		}
		</style>
	</head>
	<body>
		<?php include 'includes/navbar.php'; ?>
		<div class="container">
			<input type="hidden" id="page" value="0">
			<h1><lang lang="lang__021"></lang></h1>
			<div class="friend_list" id="friend_list">
			</div>
			<script>
				fetch_friend_list('fetch_friend_list.php');
			</script>
		</div>
	</body>
</html>