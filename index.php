<?php 
require_once 'includes/functions.php';
if(_is_session_valid(false)){
	$data = _get_data_from_token();
	$has2FA = Has2FA($data['user_id']);
	if($has2FA)
		header("Location: verify.php?t=2FA");
	else
		header("Location: home.php");
}
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	if (isset($_POST['login'])) {
		$userlogin  = $_POST['userlogin'];
		$userpass   = $_POST['userpass'];
		
		$query = $conn->query(
			sprintf(
				"SELECT * FROM users WHERE user_email LIKE '%s' OR  user_nickname LIKE '%s'",
				$conn->real_escape_string($userlogin),
				$conn->real_escape_string($userlogin)
			)
		);
		if($query){
			if($query->num_rows == 1) {
				$row = $query->fetch_assoc();
				if(password_verify($userpass, $row['user_password'])){
					if(isset($_POST['remember_me']))
						$time = 86400*365;
					else
						$time = 86400*30;
					_setcookie("token", $row['user_token'], $time);
					$has2FA = Has2FA($row['user_id']);
					new_session($time,$row['user_id'],($has2FA ? 0 : 1));
					if($row['active'] == 0)
						header("location: verify.php?t=registered");
					elseif($has2FA)
						header("Location: verify.php?t=2FA");
					else
						header("Location: home.php");
				}
			}
			//header("Location: ?err=invalid_login");
		}
	}
	if (isset($_POST['register'])) {
		$userfirstname  = $_POST['userfirstname'];
		$userlastname   = $_POST['userlastname'];
		$usernickname   = $_POST['usernickname'];
		$userpassword   = password_hash($_POST['userpass'], PASSWORD_DEFAULT);
		$useremail      = $_POST['useremail'];
		$userbirthdate  = strtotime($_POST['birthday']);
		$usergender     = $_POST['usergender'];
		$userabout      = $_POST['userabout'];
		$user_token     = _generate_token();
		if(!validateDate($_POST['birthday']))
			header("Location:?err=invalid_date");
		if(!filter_var($email, FILTER_VALIDATE_EMAIL))
			header("Location:?err=invalid_email");
		if (isset($_POST['userstatus']))
			$userstatus = $_POST['userstatus'];
		else
			$userstatus = NULL;
		
		$query = $conn->query(
			sprintf(
				"SELECT user_nickname, user_email FROM users WHERE user_nickname LIKE '%s' OR user_email LIKE '%s'",
				$conn->real_escape_string($usernickname),
				$conn->real_escape_string($useremail)
			)
		);
		if($query->num_rows > 0){
			$row = $query->fetch_assoc();
			if(strtolower($usernickname) == strtolower($row['user_nickname']) && !empty($usernickname)){
				header("Location:?err=exist_nickname");
			}
			if(strtolower($useremail) == strtolower($row['user_email'])){
				header("Location:?err=exist_email");
			}
		}else{
			$sql = 
			sprintf(
				"INSERT INTO users(user_firstname, user_lastname, user_nickname, user_password, user_email, user_gender, user_birthdate, user_about, user_token) VALUES ('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')",
				$conn->real_escape_string($userfirstname),
				$conn->real_escape_string($userlastname),
				$conn->real_escape_string($usernickname),
				$conn->real_escape_string($userpassword),
				$conn->real_escape_string($useremail),
				$conn->real_escape_string($usergender),
				$conn->real_escape_string($userbirthdate),
				$conn->real_escape_string($userabout),
				$conn->real_escape_string($user_token)
			);
			$query = $conn->query($sql);
			$link = (isset($_SERVER["HTTPS"]) ? 'https' : 'http')."://". $_SERVER['SERVER_NAME'].'/verify.php?t=verify&user_email='.htmlspecialchars($useremail).'&username='.htmlspecialchars($usernickname).'&h='.hash('sha256',($userpassword.$user_token));
			SendVerifyMail($useremail,"$userfirstname $userlastname",$link);
			if($query){
				header("location:verify.php?t=registered");
			}
		}
	}
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/index.css">
	</head>
	<body>
		<h1>Darknight</h1>
		<div class="container">
			<div class="transparent_block">
				<div class="tab">
					<button class="tablink active" onclick="openTab(event,'signin')" id="link1">Sign In</button>
					<button class="tablink" onclick="openTab(event,'signup')" id="link2">Sign Up</button>
				</div>
				<div class="content">
					<div class="tabcontent" id="signin">
						<form method="post" onsubmit="return validateLogin()">
							<div class="index_input_box">
								<label>Login<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="text" name="userlogin" id="loginuseremail" placeholder="Username or email">
							</div>
							<br>
							<div class="index_input_box">
								<label>Password<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="password" name="userpass" id="loginuserpass" placeholder="********">
							</div>
							<br>
							<label>Remember Me? </label>
							<input type="checkbox" name="remember_me" id="remember-me">
							<br><br>
							<input type="submit" value="Login" name="login">
						</form>
					</div>
					<div class="tabcontent" id="signup">
						<form method="post" onsubmit="return validateRegister()">
							<div class="index_input_box name_input">
								<label>First Name<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="text" name="userfirstname" id="userfirstname">
							</div>		
							<div class="index_input_box name_input right_content_box">
								<label>Last Name<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="text" name="userlastname" id="userlastname">
							</div>
							<br>
							<br>
							<div class="index_input_box">
								<label>Nickname<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="text" name="usernickname" id="usernickname" placeholder="@username">
							</div>
							<br>
							<div class="index_input_box">
								<label>Password<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="password" name="userpass" id="userpass">
							</div>
							<br>
							<div class="index_input_box">
								<label>Confirm Password<span>*</span></label>
								<div class="required"></div><br>
								<input type="password" name="userpassconfirm" id="userpassconfirm">
							</div>
							<br>
							<div class="index_input_box">
								<label>Email<span>*</span></label>
								<div class="required"></div>
								<br>
								<input type="text" name="useremail" id="useremail">
							</div>
							<br>
							<div class="index_input_box">
								<div class="required"></div>
								<label>Birth Date<span>*</span></label><br>
								<input type="date" id="birthday" name="birthday" value="<?php echo date('Y-m-d', time()); ?>">
							</div>
							<br>
							<div class="index_input_box">
								<div class="required"></div>
								<input type="radio" name="usergender" value="M" id="malegender" class="usergender">
								<label>Male</label>
								<input type="radio" name="usergender" value="F" id="femalegender" class="usergender">
								<label>Female</label>
							</div>
							<br><br>
							<input type="submit" value="Create Account" name="register">
						</form>
					</div>
				</div>
			</div>
		</div>
		<script src="resources/js/jquery.js"></script>
		<script>
			var isMobile = function() {
				let check = false;
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				
				return check;
			};
			if(isMobile()){
				document.getElementsByClassName('container')[0].style.width = "100%";
				document.getElementsByClassName('container')[0].style.zoom = "0.75";
			}
			function openTab(evt, choice) {
				var tabcontent = document.getElementsByClassName("tabcontent");
				for (i = 0; i < tabcontent.length; i++) {
					tabcontent[i].style.display = "none";
				}
				var tablink = document.getElementsByClassName("tablink");
				for (i = 0; i < tablink.length; i++) {
					tablink[i].classList.remove("active");
				}
				document.getElementById(choice).style.display = "block";
				evt.currentTarget.classList.add("active");
				if (typeof(Storage) !== "undefined") {
					localStorage.recent = evt.currentTarget.getAttribute('id');
				}
			}

			function validateLogin() {
				clearRequiredFields();
				var required = document.getElementsByClassName("required");
				var useremail = document.getElementById("loginuseremail").value;
				var userpass = document.getElementById("loginuserpass").value;
				var result = true;
				if (useremail == "") {
					required[0].innerHTML = "This field cannot be empty.";
					result = false;
				}
				if (userpass == "") {
					required[1].innerHTML = "This field cannot be empty.";
					result = false;
				}
				return result;
			}

			function validateRegister() {
				clearRequiredFields();
				var required = document.getElementsByClassName("required");
				var userfirstname = document.getElementById("userfirstname").value;
				var userlastname = document.getElementById("userlastname").value;
				var userpass = document.getElementById("userpass").value;
				var userpassconfirm = document.getElementById("userpassconfirm").value;
				var useremail = document.getElementById("useremail").value;
				var usergender = document.getElementsByClassName("usergender");
				var result = true;
				if (userfirstname == "") {
					required[2].innerHTML = "This field cannot be empty.";
					result = false;
				}
				if (userlastname == "") {
					required[3].innerHTML = "This field cannot be empty.";
					result = false;
				}
				if (userpass == "") {
					required[5].innerHTML = "This field cannot be empty.";
					result = false;
				}
				if (userpassconfirm == "") {
					required[6].innerHTML = "This field cannot be empty.";
					result = false;
				}
				if (userpass != "" && userpassconfirm != "" && userpass != userpassconfirm) {
					required[5].innerHTML = "Passwords doesn't match.";
					required[6].innerHTML = "Passwords doesn't match.";
					result = false;
				}
				if (useremail == "") {
					required[7].innerHTML = "This field cannot be empty.";
					result = false;
				} else if (!validateEmail(useremail)) {
					required[7].innerHTML = "Invalid Email Format.";
					result = false;
				}
				if (!usergender[0].checked && !usergender[1].checked) {
					required[8].innerHTML = "You must select your gender.";
					result = false;
				}
				return result;
			}

			function clearRequiredFields() {
				var required = document.getElementsByClassName("required");
				for (i = 0; i < required.length; i++) {
					required[i].innerHTML = "";
				}
			}
		if (typeof(Storage) !== "undefined") {
			var current = localStorage.recent;
			if (current) {
				var tabcontent = document.getElementsByClassName("tabcontent");
				for (i = 0; i < tabcontent.length; i++) {
					tabcontent[i].style.display = "none";
				}
				var tablink = document.getElementsByClassName("tablink");
				for (i = 0; i < tablink.length; i++) {
					tablink[i].classList.remove("active");
				}
				if (current == "link1")
					document.getElementById("signin").style.display = "block";
				else
					document.getElementById("signup").style.display = "block";
				document.getElementById(current).classList.add("active");
			}
		}
		<?php
		if(isset($_GET['err'])){
			$err = $_GET['err'];
			$ers = '';
			switch($err){
				case "exist_email":
					$ers = 'document.getElementsByClassName("required")[7].innerHTML = "This Email already exists.";';
					break;
				case "exist_nickname":
					$ers = 'document.getElementsByClassName("required")[4].innerHTML = "This Nickname already exists.";';
					break;
				case "invalid_nickname":
					$ers = 'document.getElementsByClassName("required")[4].innerHTML = "Only character, number, dashes allowed.";';
					break;
				case "invalid_date":
					$ers = 'document.getElementsByClassName("required")[8].innerHTML = "Invalid date.";';
					break;
				case "invalid_email":
					$ers = 'document.getElementsByClassName("required")[7].innerHTML = "Invalid email.";';
					break;
				case "invalid_login":
					$ers = 'document.getElementsByClassName("required")[0].innerHTML = "Invalid Login Credentials.";';
					$ers = 'document.getElementsByClassName("required")[1].innerHTML = "Invalid Login Credentials.";';
					break;
			}
			echo $ers;
		}
		?>
		</script>
	</body>
</html>