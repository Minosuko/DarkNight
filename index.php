<?php 
session_start();
require_once 'includes/functions.php';
if(_is_session_valid(true)){
	header("Location: home.php");
	exit();
}

if(_is_session_valid(false)){
	$data = _get_data_from_token();
	$has2FA = Has2FA($data['user_id']);
	$checkActive = checkActive();
	if(!$checkActive){
		header("Location: verify.php?t=registered");
		exit();
	}else{
		if($has2FA) {
			header("Location: verify.php?t=2FA");
			exit();
		} else {
			header("Location: home.php");
			exit();
		}
	}
}
$_SESSION['refresh_captcha'] = 1;
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/index.css">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
	</head>
	<body>
        <div class="bg-animation">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
        </div>

		<main class="login-container glass-card">
            <header class="login-header">
                <h1>Darknight</h1>
                <p>Social, Redefined.</p>
            </header>

            <div class="tab-switcher">
                <button class="tab-btn active" onclick="openTab(event,'signin')" id="link1">
                    <lang lang="lang__022">Login</lang>
                </button>
                <button class="tab-btn" onclick="openTab(event,'signup')" id="link2">
                    <lang lang="lang__032">Register</lang>
                </button>
                <div class="tab-indicator"></div>
            </div>

            <div class="content-wrapper">
                <!-- Login Form -->
                <section id="signin" class="tab-content active">
                    <div class="input-group">
                        <input type="text" name="userlogin" id="loginuseremail" required placeholder=" ">
                        <label for="loginuseremail"><lang lang="lang__022">Username or Email</lang></label>
                        <div class="required"></div>
                    </div>

                    <div class="input-group">
                        <input type="password" name="userpass" id="loginuserpass" required placeholder=" ">
                        <label for="loginuserpass"><lang lang="lang__023">Password</lang></label>
                        <div class="required"></div>
                    </div>

                    <div class="checkbox-group">
                        <label class="custom-checkbox">
                            <input type="checkbox" name="remember_me" id="remember-me">
                            <span class="checkmark"></span>
                            <lang lang="lang__024">Remember me</lang>
                        </label>
                    </div>

                    <div class="captcha-group">
                        <div class="captcha-img-wrapper">
                            <img src="data/captcha.php" alt='captchaimg' id="captchaimg0">
                        </div>
                        <button type="button" class="refresh-captcha" onclick="document.getElementById('captchaimg0').src='data/captcha.php?'+Math.random();"><i class="fa-solid fa-rotate-right"></i></button>
                        <div class="input-group">
                            <input type="text" name="captcha" id="captcha_0" required placeholder=" ">
                            <label for="captcha_0">Captcha</label>
                            <div class="required" id="required_0"></div>
                        </div>
                    </div>

                    <button class="btn-primary" name="login" onclick="validateLogin()">
                        <lang lang="lang__022">Login</lang>
                    </button>
                    <div style="text-align: center; margin-top: 15px;">
                        <a href="verify.php?t=forgot" class="btn-link">Forgot Password?</a>
                    </div>
                </section>

                <!-- Register Form -->
                <section id="signup" class="tab-content" style="display:none;">
                    <div class="row">
                        <div class="input-group col">
                            <input type="text" name="userfirstname" id="userfirstname" required placeholder=" ">
                            <label for="userfirstname"><lang lang="lang__025">First Name</lang></label>
                            <div class="required"></div>
                        </div>
                        <div class="input-group col">
                            <input type="text" name="userlastname" id="userlastname" required placeholder=" ">
                            <label for="userlastname"><lang lang="lang__026">Last Name</lang></label>
                            <div class="required"></div>
                        </div>
                    </div>

                    <div class="input-group">
                        <input type="text" name="usernickname" id="usernickname" required placeholder=" ">
                        <label for="usernickname"><lang lang="lang__027">Nickname</lang></label>
                        <div class="required"></div>
                    </div>

                    <div class="input-group">
                        <input type="text" name="useremail" id="useremail" required placeholder=" ">
                        <label for="useremail"><lang lang="lang__036">Email</lang></label>
                        <div class="required"></div>
                    </div>

                    <div class="row">
                        <div class="input-group col">
                            <input type="password" name="userpass" id="userpass" required placeholder=" ">
                            <label for="userpass"><lang lang="lang__023">Password</lang></label>
                            <div class="required"></div>
                        </div>
                        <div class="input-group col">
                            <input type="password" name="userpassconfirm" id="userpassconfirm" required placeholder=" ">
                            <label for="userpassconfirm"><lang lang="lang__028">Confirm</lang></label>
                            <div class="required"></div>
                        </div>
                    </div>

                    <div class="birthday-group">
                        <label class="group-label"><lang lang="lang__029">Birthday</lang></label>
                        <div class="birthday-selects">
                            <select id="birth_day" name="birth_day" class="custom-select">
                                <option value="" disabled selected>Day</option>
                                <?php for($i=1; $i<=31; $i++) echo "<option value='".sprintf("%02d", $i)."'>$i</option>"; ?>
                            </select>
                            <select id="birth_month" name="birth_month" class="custom-select">
                                <option value="" disabled selected>Month</option>
                                <?php 
                                $months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                foreach($months as $k => $v) echo "<option value='".sprintf("%02d", $k+1)."'>$v</option>"; 
                                ?>
                            </select>
                            <select id="birth_year" name="birth_year" class="custom-select">
                                <option value="" disabled selected>Year</option>
                                <?php for($i=date('Y'); $i>=1900; $i--) echo "<option value='$i'>$i</option>"; ?>
                            </select>
                        </div>
                        <div class="required"></div>
                    </div>

                    <div class="gender-group">
                        <label class="group-label"><lang lang="lang__030">Gender</lang></label>
                        <div class="radio-options">
                            <label class="custom-radio">
                                <input type="radio" name="usergender" value="M" id="malegender" class="usergender">
                                <span class="radio-mark"></span>
                                <span>Male</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="usergender" value="F" id="femalegender" class="usergender">
                                <span class="radio-mark"></span>
                                <span>Female</span>
                            </label>
                            <label class="custom-radio">
                                <input type="radio" name="usergender" value="U" id="othergender" class="usergender">
                                <span class="radio-mark"></span>
                                <span>Other</span>
                            </label>
                        </div>
                        <div class="required"></div>
                    </div>

                    <div class="captcha-group">
                        <div class="captcha-img-wrapper">
                            <img src="data/captcha.php" alt='captchaimg' id="captchaimg1">
                        </div>
                        <button type="button" class="refresh-captcha" onclick="document.getElementById('captchaimg1').src='data/captcha.php?'+Math.random();"><i class="fa-solid fa-rotate-right"></i></button>
                        <div class="input-group">
                            <input type="text" name="captcha" id="captcha_1" required placeholder=" ">
                            <label for="captcha_1">Captcha</label>
                            <div class="required" id="required_1"></div>
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <label class="custom-checkbox">
                            <input type="checkbox" name="tos_agree" id="tos_agree" required>
                            <span class="checkmark"></span>
                            <span>I agree to the <a href="pages/tos/" target="_blank" onclick="event.stopPropagation();">Terms of Service</a></span>
                        </label>
                    </div>

                    <button class="btn-primary" name="register" onclick="validateRegister()">
                        <lang lang="lang__040">Create Account</lang>
                    </button>
                </section>
            </div>
		</main>
		<script src="resources/js/jquery.js"></script>
		<script src="resources/js/custom-select.js?v=<?php echo time(); ?>"></script>
		<script src="resources/js/index.js?v=<?php echo time(); ?>"></script>
        <script>
            $(document).ready(function() {
                initCustomSelects();
            });
        </script>
	</body>
</html>