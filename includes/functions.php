<?php
require_once __DIR__ . "/database.php";
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
$timestamp = time();
$conn = new mysqli($host, $username, $dbpassword, $dbdata);
$GLOBALS['conn'] = $conn;
$conn->query("set character_set_results='utf8'");
$conn->query("SET NAMES 'utf8'");
function _setcookie($name, $value, $time){
	$time = time() + $time;
	setcookie($name, $value, $time);
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
class VideoStream
{
	private $path = "";
	private $stream = "";
	private $buffer = 1024*1024*32;
	private $start  = -1;
	private $end	= -1;
	private $size   = 0;
	function __construct($filePath) 
	{
		$this->path = $filePath;
	}
	private function open()
	{
		if (!($this->stream = fopen($this->path, 'rb'))) {
			die('Could not open stream for reading');
		}
	}
	private function setHeader()
	{
		ob_get_clean();
		header("Content-Type: video/mp4");
		$this->start = 0;
		$this->size  = filesize($this->path);
		$this->end   = $this->size - 1;
		header("Accept-Ranges: 0-".$this->end);
		 
		if (isset($_SERVER['HTTP_RANGE'])) {
  
			$c_start = $this->start;
			$c_end = $this->end;
 
			list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
			if (strpos($range, ',') !== false) {
				header('HTTP/1.1 416 Requested Range Not Satisfiable');
				header("Content-Range: bytes $this->start-$this->end/$this->size");
				exit;
			}
			if ($range == '-') {
				$c_start = $this->size - substr($range, 1);
			}else{
				$range = explode('-', $range);
				$c_start = $range[0];
				 
				$c_end = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $c_end;
			}
			$c_end = ($c_end > $this->end) ? $this->end : $c_end;
			if ($c_start > $c_end || $c_start > $this->size - 1 || $c_end >= $this->size) {
				header('HTTP/1.1 416 Requested Range Not Satisfiable');
				header("Content-Range: bytes $this->start-$this->end/$this->size");
				exit;
			}
			$this->start = $c_start;
			$this->end = $c_end;
			$length = $this->end - $this->start + 1;
			fseek($this->stream, $this->start);
			header('HTTP/1.1 206 Partial Content');
			header("Content-Length: $length");
			header("Content-Range: bytes $this->start-$this->end/$this->size");
		}
		else
		{
			header("Content-Length: $this->size");
		}  
		 
	}
	private function end()
	{
		fclose($this->stream);
		exit;
	}
	private function stream()
	{
		$i = $this->start;
		set_time_limit(0);
		while(!feof($this->stream) && $i <= $this->end) {
			$bytesToRead = $this->buffer;
			if(($i+$bytesToRead) > $this->end) {
				$bytesToRead = $this->end - $i + 1;
			}
			$data = fread($this->stream, $bytesToRead);
			echo $data;
			flush();
			$i += $bytesToRead;
		}
	}
	function start()
	{
		$this->open();
		$this->setHeader();
		$this->stream();
		$this->end();
	}
}
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
function validateAuthSignature(){
	
}
function _get_data_from_token($token){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_token = '%s'",
		$conn->real_escape_string($token)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch;
}
function _get_data_from_id($id){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_id = %d",
		$conn->real_escape_string($id)
	);
	$query = $conn->query($sql);
	$fetch = $query->fetch_assoc();
	return $fetch;
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
function _is_session_valid($token){
	$conn = $GLOBALS['conn'];
	$sql = sprintf(
		"SELECT * FROM users WHERE user_token = '%s'",
		$conn->real_escape_string($token)
	);
	$query = $conn->query($sql);
	if($query->num_rows > 0)
		return true;
	return false;
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
function _generate_token(){
	$gen_str = "QWERTYUIOPASDFGHJKLZXCVBNM0123456789qwertyuiopasdfghjklzxcvbnm";
	$token = "Auth_";
	$caesar = "CaesarAuth";
	$token .= str_replace("=",'',base64_encode(time()));
	$token .= '.';
	for($i = 0;$i < 16 ;$i++)
		$token .= $gen_str[rand(0, 61)];
	for($i = 0;$i < 32 ;$i++)
		$caesar .= $gen_str[rand(0, 61)];
	$caesar = caesarShift($caesar, rand(1, 26));
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
