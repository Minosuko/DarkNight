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
			<div class="settings">
				<div class="settings_nav">
					<center>
						<ul>
							<li><a href="/settings.php?tab=account" id="tab-account"><i class="fa-solid fa-address-card"></i> <lang lang="lang__033"></lang></a></li>
							<li><a href="/settings.php?tab=profile" id="tab-profile"><i class="fa-solid fa-user"></i> <lang lang="lang__034"></lang></a></li>
							<li><a href="/settings.php?tab=about" id="tab-about"><i class="fa-solid fa-circle-info"></i> <lang lang="lang__035"></lang></a></li>
						</ul>
					</center>
				</div>
				<div class="setting_info">
					<center>
						<div class="setting_tab" id="setting-tab-account">
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<label for="usernickname"><lang lang="lang__027"></lang></label>
									<br>
									<div class="psetting">
										<input type="text" name="usernickname" id="usernickname" autocomplete="off" readonly>
										<i class="fa-solid fa-angle-right"></i>
									</div>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<label for="email"><lang lang="lang__036"></lang></label>
									<br>
									<div class="psetting">
										<input type="email" name="email" id="email" autocomplete="off" readonly>
										<i class="fa-solid fa-angle-right"></i>
									</div>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<label for="password"><lang lang="lang__023"></lang></label>
									<div class="psetting">
										<i class="fa-solid fa-angle-right"></i>
									</div>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="verified"><lang lang="lang__037"></lang>: </label>
									<span id="verified-text"></span>
									<i id="verified"></i>
								</div>
							</div>
							<div class="xsetting">
								<a href="/logout.php" title="Log Out"><button class="s_button red_alert"><lang lang="lang__038"></lang> <i class="fa-solid fa-right-from-bracket"></i></button></a>
							</div>
							<div style="height: 48px"></div>
						</div>
						<div class="setting_tab" id="setting-tab-profile">
							<div class="setting__box_image">
								<div class="setting__cover_photo_box">
									<div class="setting_profile_cover" id="setting_profile_cover"></div>
									<i class="fa-solid fa-camera setting__select_cover_photo" onclick="_change_picture(1)"></i>
								</div>
								<div class="setting__photo_box">
									<img width="168px" height="168px" src="data/blank.jpg" id="profile_picture" class="setting_profile_picture">
									<i class="fa-solid fa-camera setting__select_photo" onclick="_change_picture()"></i>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box name_input">
									<label for="userfirstname"><lang lang="lang__025"></lang>:</label>
									<input type="text" name="userfirstname" id="userfirstname" autocomplete="off">
								</div>
								<div class="index_input_box name_input">
									<label for="userlastname"><lang lang="lang__026"></lang>:</label>
									<input type="text" name="userlastname" id="userlastname" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label>Birth Date</label>
									<input type="date" id="birthday" name="birthday" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<input type="radio" name="usergender" value="M" id="malegender" class="usergender">
									<label><lang lang="lang__030"></lang></label>
									<br>
									<input type="radio" name="usergender" value="F" id="femalegender" class="usergender">
									<label><lang lang="lang__031"></lang></label>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="userhometown"><lang lang="lang__039"></lang>:</label>
									<input type="text" name="userhometown" id="userhometown" autocomplete="off">
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting">
									<label for="userabout"><lang lang="lang__035"></lang>:</label>
									<textarea name="userabout" id="userabout" autocomplete="off" class="text_area"></textarea>
								</div>
							</div>
						</div>
						<div class="setting_tab" id="setting-tab-about">
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<a href="https://fb.com/MinoFoxc" target="_blank" linked="true">
										<p>Facebook <i class="fa-brands fa-facebook"></i></p>
										<div class="psetting">
											<i class="fa-solid fa-angle-right"></i>
										</div>
									</a>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<a href="https://x.com/MinosukoUwU" target="_blank" linked="true">
										<p>X <i class="fa-brands fa-x-twitter"></i> (Twitter <i class="fa-brands fa-twitter"></i>)</p>
										<div class="psetting">
											<i class="fa-solid fa-angle-right"></i>
										</div>
									</a>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<a href="https://github.com/Minosuko" target="_blank" linked="true">
										<p>Github <i class="fa-brands fa-github"></i></p>
										<div class="psetting">
											<i class="fa-solid fa-angle-right"></i>
										</div>
									</a>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<a href="https://bsky.app/profile/minosuko.love" target="_blank" linked="true">
										<p>BSky <i class="fa-solid fa-cloud"></i></p>
										<div class="psetting">
											<i class="fa-solid fa-angle-right"></i>
										</div>
									</a>
								</div>
							</div>
							<div class="setting__box">
								<div class="index_input_box xsetting asetting">
									<a href='https://ko-fi.com/X8X8CYLKP' target='_blank' linked="true"><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
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