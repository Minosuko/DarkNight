<?php
session_start();
require_once "includes/functions.php";
if (!_is_session_valid()) {
    if (_is_session_valid(true, true)) {
        header("Location: verify.php?t=2FA&redirect=" . urlencode($_SERVER['REQUEST_URI']));
    } else {
        header("Location: index.php");
    }
    exit();
}
?>
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
			
			<div id="profile-header-mount">
                <!-- Profile Header will be rendered here by main.js -->
            </div>
            
			<div id="feed"></div>
		</div>
        <?php include 'includes/chat_widget.php'; ?>
	</body>
	<script>
	fetch_profile();
	</script>
</html>
