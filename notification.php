<?php 
if (!isset($_COOKIE['token']))
    header("location:index.php");
require_once 'includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:index.php");
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
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
	</head>
	<body>
		<div class="container">
			<?php include 'includes/navbar.php'; ?>
			<h1>Notification</h1>
			<h1>in-dev</h1>
		</div>
	</body>
</html>
