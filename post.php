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
		<div class="container" style="padding: 0; max-width: 100%; height: calc(100vh - 60px);">
			<input type="hidden" id="page" value="0">
			<div id="image_content" style="height: 100%;">
                <!-- Modern Post Detail View will be loaded here -->
			</div>
		</div>
		<script>
			_load_post();
		</script>
	</body>
</html>