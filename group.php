<!DOCTYPE html>
<html>
	<head>
		<title>Darknight - Group</title>
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
			<input type="hidden" id="page" value="0">
			
			<div id="group-header-mount">
                <!-- Group Header will be rendered here by main.js -->
            </div>
            
			<div id="feed"></div>
		</div>
	</body>
	<script>
	// We'll need a fetch_group() function in main.js
	window.onload = function() {
		fetch_group();
	};
	</script>
</html>
