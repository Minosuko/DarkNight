<?php
require_once __DIR__ . "/config/database.php";
require_once __DIR__ . "/config/mail.php";
require_once __DIR__ . "/Mailer/Mailer.php";
require_once __DIR__ . "/2FAGoogleAuthenticator.php";
require_once __DIR__ . "/VideoStream.php";
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
$timestamp = time();
$conn = new mysqli($host, $username, $dbpassword, $dbdata);
$Mailer = new Mailer($mailHostname, $mailPort, $mailSecure, $mailAuth, $mailUsername, $mailPassword);
$GLOBALS['conn'] = $conn;
$GLOBALS['Mailer'] = $Mailer;
$GLOBALS['GoogleAuthenticator'] = new GoogleAuthenticator();
$conn->query("set character_set_results='utf8'");
$conn->query("SET NAMES 'utf8'");
function _setcookie($name, $value, $time){
	$time = time() + $time;
	setcookie($name, $value, $time);
}
function _verify_2FA($code, $userID){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM `twofactorauth` WHERE user_id = %d",
		$conn->real_escape_string($userID)
	);
	$query = $conn->query($sql);
	$rows = $query->fetch_all(MYSQLI_ASSOC);
	foreach($rows as $row){
		$VerifyCode = $GLOBALS['GoogleAuthenticator']->verifyCodeAllZone($row['auth_key'], $code);
		if($VerifyCode)
			return true;
	}
	return false;
}
/*
function compress_video($source, $quality = 90) {
	$info = mime_content_type($source);
	switch($info){
		case 'video/mp4': 
			$image = ($source);
			break;
	}
	if(isset($image)){
	}else{
	}
	return $imagedata;
}
*/
function video_stream($file_path){
	$VidStream = new VideoStream($file_path);
	$VidStream->start();
}
function compress_image($source, $quality = 90) {
	$info = getimagesize($source);
	switch($info['mime']){
		case 'image/jpeg':
			$image = imagecreatefromjpeg($source);
			break;
		case 'image/jpg':
			$image = imagecreatefromjpeg($source);
			break;
		case 'image/gif':
			$image = imagecreatefromgif($source);
			break;
		case 'image/png': 
			$image = imagecreatefrompng($source);
			break;
		case 'image/webp': 
			$image = imagecreatefromwebp($source);
			break;
		case 'image/bmp': 
			$image = imagecreatefrombmp($source);
			break;
	}
	if(isset($image)){
		ob_start();
		imagejpeg($image, null, $quality);
		$imagedata = ob_get_contents();
		ob_end_clean();
		imagedestroy($image);
	}else{
		$imagedata = file_get_contents($source);
	}
	return $imagedata;
}
function validateDate($date, $format = 'Y-m-d') { 
	$d = DateTime::createFromFormat($format, $date); 
	return $d && $d->format($format) === $date; 
}
function SendVerifyMail($email, $name, $link){
	$Mailer = $GLOBALS['Mailer'];
	$MailBody = '<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<style>
			h1{
				text-align: center;
				color: white;
				font-size: 400%;
			}
			p{
				color: white;
				margin: 0;
				font-size: 180%;
			}
			a{
				color: cyan;
				margin: 0;
				text-decoration:none;
				font-size: 180%;
			}
			b{
				color: white;
				font-size: 200%;
			}
			body{
				font-family: Roboto;
				background: url(\'data:image/jpeg;base64,'.base64_encode(file_get_contents(__DIR__ . '/../data/darknight.jpg')).'\');
			}
			.content{
				width: 60%;
				display: block;
				margin-top: 15%;
				margin: auto;
				position: realtive;
				padding: 10px;
				background: rgba(255, 255, 255, 0);
				box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
				backdrop-filter: blur(3.7px);
				-webkit-backdrop-filter: blur(3.7px);
				border-top: 1px solid rgba(255, 255, 255, 0.34);
				border-bottom: 1px solid rgba(255, 255, 255, 0.34);
				border-left: 60px solid transparent;
				border-right: 60px solid transparent;
			}
			button{
				font-size: 18px;
				cursor: pointer;
				padding: 1em;
				color: white;
				border: none;
				border-radius: 30px;
				font-weight: 600;
				width: 100%;
				background: #0066cc;
			}
		</style>
	</head>
	<body>
		<h1>Darknight Social</h1>
		<div class="container">
			<div class="transparent_block">
				<div class="content">
					<p>Hello '.$name.',</p>
					<p>Follow this link to verify your email address.</p>
					<br>
					<a href="'.$link.'"><button>Verify</button></a>
					<br>
					<br>
					<p>Or you can follow this link</p>
					<br>
					<a href="'.$link.'">'.$link.'</a>
					<br>
					<br>
					<p>If you didn’t ask to verify this address, you can ignore this email.</p>
					<br>
					<p>Thanks</p>
					<center><b>- DarkNightDev - </b></center>
				</div>
			</div>
		</div>
	</body>
</html>';
	$Mailer->send(
		$email,
		"DarkNight - Verify",
		$MailBody,
		['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]
	);
}
function is_user_exists($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_id = %d",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0)
		return true;
	return false;
}
function is_post_exists($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM posts WHERE post_id = %d",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0)
		return true;
	return false;
}
function getBrowser() 
{
	$u_agent = $_SERVER['HTTP_USER_AGENT']; 
	$bname = 'Unknown';
	$platform = 'Unknown';
	$version= "";
	if (preg_match('/linux/i', $u_agent)){
		$platform = 'linux';
	}
	elseif (preg_match('/macintosh|mac os x/i', $u_agent)){
		$platform = 'mac';
	}
	elseif (preg_match('/windows|win32/i', $u_agent)){
		$platform = 'windows';
	}
	if(preg_match('/MSIE/i',$u_agent) && !preg_match('/Opera/i',$u_agent))
	{
		$bname = 'Internet Explorer'; 
		$ub = "MSIE"; 
	}
	elseif(preg_match('/Edg/i',$u_agent))
	{
		$bname = 'Microsoft Edge'; 
		$ub = "Edg"; 
	}
	elseif(preg_match('/Firefox/i',$u_agent))
	{
		$bname = 'Mozilla Firefox'; 
		$ub = "Firefox"; 
	}
	elseif(preg_match('/Chrome/i',$u_agent))
	{
		$bname = 'Google Chrome'; 
		$ub = "Chrome"; 
	}
	elseif(preg_match('/Safari/i',$u_agent))
	{
		$bname = 'Apple Safari'; 
		$ub = "Safari"; 
	}
	elseif(preg_match('/Opera/i',$u_agent))
	{
		$bname = 'Opera'; 
		$ub = "Opera"; 
	}
	elseif(preg_match('/Netscape/i',$u_agent))
	{
		$bname = 'Netscape'; 
		$ub = "Netscape"; 
	}
	$known = array('Version', $ub, 'other');
	$pattern = '#(?<browser>' . join('|', $known) .
	')[/ ]+(?<version>[0-9.|a-zA-Z.]*)#';
	if (!preg_match_all($pattern, $u_agent, $matches)){}
	$i = count($matches['browser']);
	if ($i != 1) {
		if (strripos($u_agent,"Version") < strripos($u_agent,$ub)){
			$version= $matches['version'][0];
		}
		else {
			$version= $matches['version'][1];
		}
	}
	else {
		$version= $matches['version'][0];
	}
	if ($version==null || $version=="") {$version="?";}
	return array(
		'userAgent' => $u_agent,
		'name'      => $bname,
		'version'   => $version,
		'platform'  => $platform,
		'pattern'   => $pattern
	);
}
function isMobile(){
	$uaFull = strtolower($_SERVER['HTTP_USER_AGENT']);
	$uaStart = substr($uaFull, 0, 4);
	$uaPhone = [
		'(android|bb\d+|meego).+mobile',
		'avantgo',
		'bada\/',
		'blackberry',
		'blazer',
		'compal',
		'elaine',
		'fennec',
		'hiptop',
		'iemobile',
		'ip(hone|od)',
		'iris',
		'kindle',
		'lge ',
		'maemo',
		'midp',
		'mmp',
		'mobile.+firefox',
		'netfront',
		'opera m(ob|in)i',
		'palm( os)?',
		'phone',
		'p(ixi|re)\/',
		'plucker',
		'pocket',
		'psp',
		'series(4|6)0',
		'symbian',
		'treo',
		'up\.(browser|link)',
		'vodafone',
		'wap',
		'windows ce',
		'xda',
		'xiino'
	];

	$uaMobile = [
		'1207', 
		'6310', 
		'6590', 
		'3gso', 
		'4thp', 
		'50[1-6]i', 
		'770s', 
		'802s', 
		'a wa', 
		'abac|ac(er|oo|s\-)', 
		'ai(ko|rn)', 
		'al(av|ca|co)', 
		'amoi', 
		'an(ex|ny|yw)', 
		'aptu', 
		'ar(ch|go)', 
		'as(te|us)', 
		'attw', 
		'au(di|\-m|r |s )', 
		'avan', 
		'be(ck|ll|nq)', 
		'bi(lb|rd)', 
		'bl(ac|az)', 
		'br(e|v)w', 
		'bumb', 
		'bw\-(n|u)', 
		'c55\/', 
		'capi', 
		'ccwa', 
		'cdm\-', 
		'cell', 
		'chtm', 
		'cldc', 
		'cmd\-', 
		'co(mp|nd)', 
		'craw', 
		'da(it|ll|ng)', 
		'dbte', 
		'dc\-s', 
		'devi', 
		'dica', 
		'dmob', 
		'do(c|p)o', 
		'ds(12|\-d)', 
		'el(49|ai)', 
		'em(l2|ul)', 
		'er(ic|k0)', 
		'esl8', 
		'ez([4-7]0|os|wa|ze)', 
		'fetc', 
		'fly(\-|_)', 
		'g1 u', 
		'g560', 
		'gene', 
		'gf\-5', 
		'g\-mo', 
		'go(\.w|od)', 
		'gr(ad|un)', 
		'haie', 
		'hcit', 
		'hd\-(m|p|t)', 
		'hei\-', 
		'hi(pt|ta)', 
		'hp( i|ip)', 
		'hs\-c', 
		'ht(c(\-| |_|a|g|p|s|t)|tp)', 
		'hu(aw|tc)', 
		'i\-(20|go|ma)', 
		'i230', 
		'iac( |\-|\/)', 
		'ibro', 
		'idea', 
		'ig01', 
		'ikom', 
		'im1k', 
		'inno', 
		'ipaq', 
		'iris', 
		'ja(t|v)a', 
		'jbro', 
		'jemu', 
		'jigs', 
		'kddi', 
		'keji', 
		'kgt( |\/)', 
		'klon', 
		'kpt ', 
		'kwc\-', 
		'kyo(c|k)', 
		'le(no|xi)', 
		'lg( g|\/(k|l|u)|50|54|\-[a-w])', 
		'libw', 
		'lynx', 
		'm1\-w', 
		'm3ga', 
		'm50\/', 
		'ma(te|ui|xo)', 
		'mc(01|21|ca)', 
		'm\-cr', 
		'me(rc|ri)', 
		'mi(o8|oa|ts)', 
		'mmef', 
		'mo(01|02|bi|de|do|t(\-| |o|v)|zz)', 
		'mt(50|p1|v )', 
		'mwbp', 
		'mywa', 
		'n10[0-2]', 
		'n20[2-3]', 
		'n30(0|2)', 
		'n50(0|2|5)', 
		'n7(0(0|1)|10)', 
		'ne((c|m)\-|on|tf|wf|wg|wt)', 
		'nok(6|i)', 
		'nzph', 
		'o2im', 
		'op(ti|wv)', 
		'oran', 
		'owg1', 
		'p800', 
		'pan(a|d|t)', 
		'pdxg', 
		'pg(13|\-([1-8]|c))', 
		'phil', 
		'pire', 
		'pl(ay|uc)', 
		'pn\-2', 
		'po(ck|rt|se)', 
		'prox', 
		'psio', 
		'pt\-g', 
		'qa\-a', 
		'qc(07|12|21|32|60|\-[2-7]|i\-)', 
		'qtek', 
		'r380', 
		'r600', 
		'raks', 
		'rim9', 
		'ro(ve|zo)', 
		's55\/', 
		'sa(ge|ma|mm|ms|ny|va)', 
		'sc(01|h\-|oo|p\-)', 
		'sdk\/', 
		'se(c(\-|0|1)|47|mc|nd|ri)', 
		'sgh\-', 
		'shar', 
		'sie(\-|m)', 
		'sk\-0', 
		'sl(45|id)', 
		'sm(al|ar|b3|it|t5)', 
		'so(ft|ny)', 
		'sp(01|h\-|v\-|v )', 
		'sy(01|mb)', 
		't2(18|50)', 
		't6(00|10|18)', 
		'ta(gt|lk)', 
		'tcl\-', 
		'tdg\-', 
		'tel(i|m)', 
		'tim\-', 
		't\-mo', 
		'to(pl|sh)', 
		'ts(70|m\-|m3|m5)', 
		'tx\-9', 
		'up(\.b|g1|si)', 
		'utst', 
		'v400', 
		'v750', 
		'veri', 
		'vi(rg|te)', 
		'vk(40|5[0-3]|\-v)', 
		'vm40', 
		'voda', 
		'vulc', 
		'vx(52|53|60|61|70|80|81|83|85|98)', 
		'w3c(\-| )', 
		'webc', 
		'whit', 
		'wi(g |nc|nw)', 
		'wmlb', 
		'wonu', 
		'x700', 
		'yas\-', 
		'your', 
		'zeto', 
		'zte\-'
	];

	$isPhone = preg_match('/' . implode($uaPhone, '|') . '/i', $uaFull);
	$isMobile = preg_match('/' . implode($uaMobile, '|') . '/i', $uaStart);

	if($isPhone || $isMobile)
		return true;
	return false;
}
function getUserIP() {
	$ipaddress = '';
	if (isset($_SERVER['HTTP_CLIENT_IP']))
		$ipaddress = $_SERVER['HTTP_CLIENT_IP'];
	else if(isset($_SERVER['HTTP_X_FORWARDED_FOR']))
		$ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
	else if(isset($_SERVER['HTTP_X_FORWARDED']))
		$ipaddress = $_SERVER['HTTP_X_FORWARDED'];
	else if(isset($_SERVER['HTTP_X_CLUSTER_CLIENT_IP']))
		$ipaddress = $_SERVER['HTTP_X_CLUSTER_CLIENT_IP'];
	else if(isset($_SERVER['HTTP_FORWARDED_FOR']))
		$ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
	else if(isset($_SERVER['HTTP_FORWARDED']))
		$ipaddress = $_SERVER['HTTP_FORWARDED'];
	else if(isset($_SERVER['REMOTE_ADDR']))
		$ipaddress = $_SERVER['REMOTE_ADDR'];
	else
		$ipaddress = 'UNKNOWN';
	return $ipaddress;
}
function Has2FA($userID){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM twofactorauth WHERE user_id = %d",
		$conn->real_escape_string($userID)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0)
		return true;
	return false;
}
function _get_session_info(){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_token = '%s'",
		$conn->real_escape_string($token)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch;
}
function _verify($username, $email, $hash){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_nickname LIKE '%s' AND user_email LIKE '%s' AND active = 0",
		$conn->real_escape_string($username),
		$conn->real_escape_string($email)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0){
		$fetch = $query->fetch_assoc();
		if(hash('sha256',($fetch['user_password'].$fetch['user_token'])) == $hash){
			$sql = sprintf(
				"UPDATE users SET active = 1 WHERE user_nickname LIKE '%s' AND user_email LIKE '%s'",
				$conn->real_escape_string($username),
				$conn->real_escape_string($email)
			);
			$query = $conn->query($sql);
			return true;
		}
	}
	return false;
}
function new_session($time, $userID, $auth2FA){
	$session_id = uniqid();
	$session_token = _generate_token("SesAuth_");
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"INSERT INTO session (session_id, session_token,session_device,user_id,session_ip,session_valid,last_online) VALUES ('%s','%s','%s',%d,'%s',%d,%d)",
		$session_id,
		$session_token,
		$conn->real_escape_string($_SERVER['HTTP_USER_AGENT']),
		$userID,
		getUserIP(),
		$auth2FA,
		time()
	);
	$query = $conn->query($sql);
	_setcookie("session_id", $session_id, $time);
	_setcookie("session_token", $session_token, $time);
}
function _is_session_valid($checkActive = true){
	if(!isset($_COOKIE['token']) && !isset($_COOKIE['session_id']) && !isset($_COOKIE['session_token']))
		return false;
	$add = ($checkActive) ? ' AND session_valid = 1' : '';
	$session_id = $_COOKIE['session_id'];
	$session_token = $_COOKIE['session_token'];
	$token = $_COOKIE['token'];
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_token = '%s'",
		$conn->real_escape_string($token)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0){
		$userID = _get_data_from_token($token)['user_id'];
		$sql = sprintf(
			"SELECT * FROM session WHERE user_id = %d AND session_id = '%s' AND session_token = '%s'%s",
			$userID,
			$conn->real_escape_string($session_id),
			$conn->real_escape_string($session_token),
			$add
		);
		$query = $conn->query($sql);
		if($query->num_rows > 0)
			return true;
	}
	return false;
}
function _get_last_online($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT last_online FROM session WHERE user_id = %d ORDER BY last_online DESC",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch['last_online'];
}
function _get_data_from_token(){
	$token = $_COOKIE['token'];
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_token = '%s'",
		$conn->real_escape_string($token)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch;
}
function _get_hash_from_media_id($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM media WHERE media_id = '%d'",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch['media_hash'];
}
function _media_format($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM media WHERE media_id = '%d'",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch['media_format'];
}
function _is_video($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM media WHERE media_id = '%d'",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return (substr($fetch['media_format'],0,5) == 'video');
}
function caesarShift($str, $amount) {
	if ($amount < 0) {
		return caesarShift($str, $amount + 26);
	}
	$output = [];
	for ($i = 0; $i < strlen($str); $i++) {
		$c = $str[$i];
		if (preg_match("/[a-z]/i", $c)) {
			$code = ord($str[$i]);
			if ($code >= 65 && $code <= 90) {
				$c = chr((($code - 65 + $amount) % 26) + 65);
			} elseif ($code >= 97 && $code <= 122) {
				$c = chr((($code - 97 + $amount) % 26) + 97);
			}
		}
		$output[] = $c;
	}
	return implode('', $output);
}
function _generate_token($start = 'Auth_'){
	$gen_str = "QWERTYUIOPASDFGHJKLZXCVBNM0123456789qwertyuiopasdfghjklzxcvbnm";
	$token = "$start";
	$caesar = "CaesarAuth";
	$token .= str_replace("=",'',base64_encode(time()));
	$token .= '.';
	for($i = 0;$i < 16 ;$i++)
		$token .= $gen_str[random_int(0, 61)];
	for($i = 0;$i < 32 ;$i++)
		$caesar .= $gen_str[random_int(0, 61)];
	$caesar = caesarShift($caesar, random_int(1, 26));
	$token .= '.';
	$token .= $caesar;
	return $token;
}
function _about_trim($about){
	$html = htmlspecialchars($about);
	$html = str_replace("\n","<br>",$html);
	$html = preg_replace('/\[color=#(\w+|\d+)\](.+)\[\/color\]/', "<a style=\"color: #$1;\">$2</a>", $html);
	$html = preg_replace('#\bhttps?://[^,\s()<>]+(?:\([\w\d]+\)|([^,[:punct:]\s]|/))#', '<a class="post-link" href="$0" target="_blank">$0</a>', $html);
	return $html;
}
function _caption_trim($caption){
	$html = htmlspecialchars($caption);
	$html = preg_replace('/\[color=#(\w+|\d+)\](.+)\[\/color\]/', "<a style=\"color: #$1;\">$2</a>", $html);
	$html = preg_replace('/\[code\]([\s\S]+)\[\/code\]/', "<code>$1</code>", $html);
	$html = preg_replace('/\[code=(\w+)\]([\s\S]+)\[\/code\]/', "<code class='language-$1'>$2</code>", $html);
	$html = preg_replace('#\bhttps?://[^,\s()<>]+(?:\([\w\d]+\)|([^,[:punct:]\s]|/))#', '<a class="post-link" href="$0" target="_blank">$0</a>', $html);
	return $html;
}
function is_friend($user_id, $target_id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM friendship WHERE user1_id = %d AND user12_id = %d AND friendship_status = 1",
		$conn->real_escape_string($user_id),
		$conn->real_escape_string($target_id)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0)
		return true;
	return false;
}
function is_liked($user_id, $post_id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM likes WHERE user_id = %d AND post_id = %d",
		$conn->real_escape_string($user_id),
		$conn->real_escape_string($post_id)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0)
		return true;
	return false;
}
function total_like($post_id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT COUNT(*) as count FROM likes WHERE post_id = %d",
		$conn->real_escape_string($post_id)
	);
	$query = $conn->query($sql);
	return $query->fetch_assoc()['count'];
}
function total_share($post_id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT COUNT(*) as count FROM posts WHERE is_share = %d",
		$conn->real_escape_string($post_id)
	);
	$query = $conn->query($sql);
	return $query->fetch_assoc()['count'];
}
function total_comment($post_id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT COUNT(*) as count FROM comments WHERE post_id = %d",
		$conn->real_escape_string($post_id)
	);
	$query = $conn->query($sql);
	return $query->fetch_assoc()['count'];
}
function convertDate($datetime, $full = false) {
	$now = new DateTime;
	$ago = new DateTime($datetime);
	$diff = $now->diff($ago);
	
	$diff->w = floor($diff->d / 7);
	$diff->d -= $diff->w * 7;
	
	$string = array(
		'y' => 'year',
		'm' => 'month',
		'w' => 'week',
		'd' => 'day',
		'h' => 'hour',
		'i' => 'minute',
		's' => 'second');

	foreach ($string as $k => &$v) {
		if ($diff->$k) {
			$v = $diff->$k . ' ' . $v . ($diff->$k > 1 ? 's' : '');
		} else {
			unset($string[$k]);
		}
	}
	
	if (!$full) $string = array_slice($string, 0, 1);
	return $string ? implode(', ', $string) : 'just now';
}
function _trim_hash($hash){
	$hash = strtolower($hash);
	$validChar = ['a','b','c','d','e','f','0','1','2','3','4','5','6','7','8','9'];
	$invalidChar = str_split(str_replace($validChar,'',$hash));
	return str_replace($invalidChar,'',$hash);
}
function exif_videotype($path){
	$mime = mime_content_type($path);
	$supported_mime = ['video/mp4','video/mpeg','video/webm'];
	return in_array($mime,$supported_mime);
}
?>