<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
	</head>
	<body>
		<?php include 'includes/navbar.php'; ?>
		<div class="container">
			<input type="hidden" id="page" value="0">
			<input type="hidden" id="request_page" value="0">

			<div class="friends-tabs">
				<button class="friends-tab active" data-tab="friends">
					<lang lang="lang__021"></lang>
				</button>
				<button class="friends-tab" data-tab="requests">
					<lang lang="lang__020"></lang>
					<span class="badge" id="request-count-badge" style="display: none;">0</span>
				</button>
			</div>

			<div class="friends-content active" id="friends-content">
				<div class="friend_list" id="friend_list"></div>
			</div>

			<div class="friends-content" id="requests-content">
				<div class="friend_reqest_list" id="friend_reqest_list"></div>
			</div>

			<script>
				initFriendsPage();
			</script>
		</div>
	</body>
</html>