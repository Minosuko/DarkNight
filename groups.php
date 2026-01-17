<!DOCTYPE html>
<html>
	<head>
		<title>Darknight - Communities</title>
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
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding:0 10px;">
				<h1 style="color:var(--color-text-main); font-size:1.8rem;">Communities</h1>
				<button class="btn-primary" onclick="modal_open('create_group')"><i class="fa-solid fa-plus"></i> Create Group</button>
			</div>
			
			<div id="groups-discovery-mount">
                <!-- Groups will be rendered here by main.js -->
                <div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>
            </div>
		</div>
	</body>
	<script>
	window.onload = function() {
		_load_groups_discovery();
	};
	</script>
</html>
