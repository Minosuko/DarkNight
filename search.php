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
			<h1><lang lang="lang__019"></lang></h1>
			<div class="globalsearch">
				<select name="searchtype" title="searchtype" id="searchtype">
					<option value="0">User</option>
					<option value="1">Posts</option>
				</select>
				<div class="gsinput_box">
					<input type="text" placeholder="Search" name="query" id="query">
				</div>
				<input type="submit" value="Search" id="querybutton" onclick="_search()">
			</div>
			<br>
			<div id="search"></div>
		</div>
	</body>
</html>
