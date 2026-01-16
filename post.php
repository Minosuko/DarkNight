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
		<style>
			body{
				overflow-y: hidden;
			}
			.caption_box_shadow{
				width: 96.2%;
			}
			.caption_box pre{
				width: 100%;
			}
		</style>
	</head>
	<body>
		<?php include 'includes/navbar.php'; ?>
		<div class="container">
			<input type="hidden" id="page" value="0">
			<div id="image_content">
				<center>
					<div class="left_content" id="_content_left">
					</div>
				</center>
				<div class="right_content" id="_content_right"></div>
			</div>
		</div>
		<script>
			_load_post();
		</script>
	</body>
</html>