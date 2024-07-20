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
	</head>
	<body>
		<div class="container">
			<?php include 'includes/navbar.php'; ?>
			<div class="settings">
				<div class="settings_nav">
					<center>
						<ul>
							<li><a href="/settings.php?tab=account" id="tab-account"><i class="fa-solid fa-address-card"></i> Account</a></li>
							<li><a href="/settings.php?tab=profile" id="tab-profile"><i class="fa-solid fa-user"></i> Profile</a></li>
						</ul>
					</center>
				</div>
				<div class="setting_info">
					<center>
						<div class="setting_tab" id="setting-tab-account">
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="usernickname">Username:</label>
									<br>
									<input type="text" name="usernickname" id="usernickname" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="email">Email:</label>
									<input type="email" name="email" id="email" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box name_input">
									<label for="password">Password:</label>
									<input type="password" name="password" id="password" autocomplete="off">
								</div>
								<div class="index_input_box name_input">
									<label for="re-password">Repeat Password:</label>
									<input type="password" name="re-password" id="re-password" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="verified">Verified Status: </label>
									<span id="verified-text"></span>
									<i id="verified"></i>
								</div>
							</div>
							<div class="xsetting">
								<a href="/logout.php" title="Log Out"><button class="s_button red_alert">Logout <i class="fa-solid fa-right-from-bracket"></i></button></a>
							</div>
							<div style="height: 48px"></div>
						</div>
						<div class="setting_tab" id="setting-tab-profile">
							<div class="setting__box">
								<div class="index_input_box name_input">
									<label for="userfirstname">First name:</label>
									<input type="text" name="userfirstname" id="userfirstname" autocomplete="off">
								</div>
								<div class="index_input_box name_input">
									<label for="userlastname">Last name:</label>
									<input type="text" name="userlastname" id="userlastname" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label>Birth Date</label>
									<input type="date" id="birthday" name="birthday" value="<?php echo date('Y-m-d', time()); ?>" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<input type="radio" name="usergender" value="M" id="malegender" class="usergender">
									<label>Male</label>
									<br>
									<input type="radio" name="usergender" value="F" id="femalegender" class="usergender">
									<label>Female</label>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="userhometown">Home Town:</label>
									<input type="text" name="userhometown" id="userhometown" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="userabout">About:</label>
									<textarea name="userabout" id="userabout" autocomplete="off" class="text_area"></textarea>
								</div>
							</div>
						</div>
					</center>
				</div>
			</div>
		</div>
		<script>
			_load_settings();
		</script>
	</body>
</html>