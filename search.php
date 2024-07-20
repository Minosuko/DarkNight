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
			<h1>Search Results</h1>
			<?php
				/*
				$location = $_GET['location'];
				$key = $conn->real_escape_string($_GET['query']);
				if($location == 'emails') {
					$sql = "SELECT * FROM users WHERE users.user_email = '$key'";
					include 'includes/userquery.php';
				} else if($location == 'names') {
					$name = explode(' ', $key, 2); // Break String into Array.
					if(empty($name[1]))
						$sql = 
						sprintf(
							"SELECT * FROM users WHERE users.user_firstname = '%s' OR users.user_lastname= '%s'",
							$conn->real_escape_string($name[0]),
							$conn->real_escape_string($name[0])
						);
					else
						$sql = 
						sprintf(
							"SELECT * FROM users WHERE users.user_firstname = '%s' AND users.user_lastname= '%s'",
							$conn->real_escape_string($name[0]),
							$conn->real_escape_string($name[1])
						);
					include 'includes/userquery.php';
				} else if($location == 'hometowns') {
					$sql = "SELECT * FROM users WHERE users.user_hometown = '$key'";
					include 'includes/userquery.php';
				} else if($location == 'posts') {
					$sql = "SELECT posts.post_caption, posts.post_time, posts.post_public, users.user_firstname,
									users.user_lastname, users.user_id, users.user_gender, posts.post_id
							FROM posts
							JOIN users
							ON posts.post_by = users.user_id
							WHERE (posts.post_public = 'Y' OR users.user_id = {$data['user_id']}) AND posts.post_caption LIKE '%$key%'
							UNION
							SELECT posts.post_caption, posts.post_time, posts.post_public, users.user_firstname,
									users.user_lastname, users.user_id, users.user_gender, posts.post_id
							FROM posts
							JOIN users
							ON posts.post_by = users.user_id
							JOIN (
								SELECT friendship.user1_id AS user_id
								FROM friendship
								WHERE friendship.user2_id = {$data['user_id']} AND friendship.friendship_status = 1
								UNION
								SELECT friendship.user2_id AS user_id
								FROM friendship
								WHERE friendship.user1_id = {$data['user_id']} AND friendship.friendship_status = 1
							) userfriends
							ON userfriends.user_id = posts.post_by
							WHERE posts.post_public = 'N' AND posts.post_caption LIKE '%$key%'
							ORDER BY post_time DESC";
					$query = $conn->query($sql);
					$width = '40px'; // Profile Image Dimensions
					$height = '40px';
					if($query->num_rows == 0){
						echo '<div class="post">';
						echo 'There is no results given the keyword, try to widen your search query.';
						echo '</div>';
						echo '<br>';
					}
					while($row = $query->fetch_assoc()){
						include 'includes/post.php';
						echo '<br>';
					}
				}
				*/
			?>
			<h1>Currently disabled until search backend is improved</h1>
		</div>
	</body>
</html>
