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
                <a href="/profile.php" title="My Profile">
				    <img class="pfp" src="data/blank.jpg" id="pfp_box">
                </a>
				<div class="input_box" onclick="make_post()">
					What's on your mind?
				</div>
			</div>
            
			<br>
			<div id="feed">
                <!-- Posts will be loaded here via JS -->
			</div>
			<br><br><br>
		</div>
		
		<script>
			fetch_post("Post.php?scope=feed");
		</script>
	</body>
</html>