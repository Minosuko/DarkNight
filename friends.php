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
		<div class="container" style="max-width: 900px; padding-top: 20px;">
			<input type="hidden" id="page" value="0">
			<input type="hidden" id="request_page" value="0">

			<div class="friends-header">
				<div class="friends-tabs">
					<button class="friends-tab active" data-tab="friends">
						<i class="fa-solid fa-user-group"></i> <lang lang="lang__021"></lang>
					</button>
					<button class="friends-tab" data-tab="requests">
						<i class="fa-solid fa-user-plus"></i> <lang lang="lang__020"></lang>
						<span class="badge" id="request-count-badge" style="display: none;">0</span>
					</button>
				</div>

				<div class="friends-search-container" id="friends-search-wrapper">
					<div class="gsinput_box">
						<i class="fa-solid fa-magnifying-glass search-icon"></i>
						<input type="text" id="friends-search" class="premium-input" placeholder="Search friends..." onkeyup="filterFriendsList()">
					</div>
				</div>
			</div>

			<div class="friends-content active" id="friends-content">
				<div class="friend_list_modern" id="friend_list"></div>
			</div>

			<div class="friends-content" id="requests-content">
				<div class="friend_reqest_list_modern" id="friend_reqest_list"></div>
			</div>

			<script>
				initFriendsPage();
			</script>
		</div>
			<?php include 'includes/chat_widget.php'; ?>
	</body>
</html>