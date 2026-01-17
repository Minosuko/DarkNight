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
			
			<div class="globalsearch">
				<h2><lang lang="lang__019"></lang> Search</h2>
				<div class="search-controls">
					<div class="select-wrapper">
						<select name="searchtype" id="searchtype" class="premium-select" onchange="toggleSearchFilters()">
							<option value="0">User</option>
							<option value="1">Posts</option>
							<option value="2">Following</option>
							<option value="3">Follower</option>
							<option value="4">Communities</option>
						</select>
						<i class="fa-solid fa-chevron-down select-icon"></i>
					</div>
					
					<div class="gsinput_box">
						<i class="fa-solid fa-magnifying-glass search-icon"></i>
						<input type="text" placeholder="Search..." name="query" id="query" class="premium-input">
					</div>
					
					<button id="querybutton" onclick="_search()" class="btn-primary">
						<i class="fa-solid fa-arrow-right"></i>
					</button>
				</div>

				<!-- Advanced Filters Row -->
				<div id="advanced-filters" class="search-filters" style="display:none;">
					<div class="filter-group">
						<label>Scope</label>
						<select id="search-scope" class="premium-select-sm" onchange="toggleSearchFilters()">
							<option value="all">All Posts</option>
							<option value="me">My Posts</option>
							<option value="friends">Friends' Posts</option>
							<option value="groups">Joined Communities</option>
						</select>
					</div>
					<div class="filter-group" id="scope-community-group" style="display:none;">
						<label>Community</label>
						<select id="search-comm-id" class="premium-select-sm">
							<option value="0">Any Joined Community</option>
						</select>
					</div>
					<div class="filter-group">
						<label>Privacy</label>
						<select id="search-privacy" class="premium-select-sm">
							<option value="all">Any Privacy</option>
							<option value="2">Public Only</option>
							<option value="1">Friends Only</option>
							<option value="0">Private Only</option>
						</select>
					</div>
					<div class="filter-group">
						<label>From</label>
						<input type="date" id="search-start-date" class="premium-input-sm">
					</div>
					<div class="filter-group">
						<label>To</label>
						<input type="date" id="search-end-date" class="premium-input-sm">
					</div>
				</div>
			</div>
			
			<div id="search" class="search-results-grid"></div>
			<div id="loading_posts"></div>
		</div>
	</body>
</html>
