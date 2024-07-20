<?php
if (!isset($_COOKIE['token']))
    header("location:index.php");
require_once '../includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
    header("location:/index.php");
$compressed = true;
if(isset($_GET['original']))
	$compressed = false;
if(isset($_GET['h'])){
	if(file_exists("images/image/{$_GET['h']}.bin") || file_exists("images/compressed/{$_GET['h']}.bin")){
		if($compressed && !file_exists("images/compressed/{$_GET['h']}.bin"))
			file_put_contents("images/compressed/{$_GET['h']}.bin",compress_image("images/image/{$_GET['h']}.bin"));
		if(file_exists("images/compressed/{$_GET['h']}.bin") && $compressed){
			$fdate = filemtime("images/compressed/{$_GET['h']}.bin");
			$etag = md5_file("images/compressed/{$_GET['h']}.bin");
		}else{
			$fdate = filemtime("images/image/{$_GET['h']}.bin");
			$etag = md5_file("images/image/{$_GET['h']}.bin");
		}
	}else{
		$fdate = time();
	}
}elseif(isset($_GET['t'])){
	$type = $_GET['t'];
	if($type == "default_M"){
		$etag = md5_file("images/M.jpg");
		$fdate = filemtime("images/M.jpg");
	}
	if($type == "default_F"){
		$etag = md5_file("images/F.jpg");
		$fdate = filemtime("images/F.jpg");
	}
}
$tsstring = gmdate('D, d M Y H:i:s ', $fdate) . 'GMT';
$if_modified_since = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? $_SERVER['HTTP_IF_MODIFIED_SINCE'] : false;
$if_none_match = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? $_SERVER['HTTP_IF_NONE_MATCH'] : false;
if ((($if_none_match && $if_none_match == $etag) || (!$if_none_match)) && ($if_modified_since && $if_modified_since == $tsstring))
{
    header('HTTP/1.1 304 Not Modified');
	exit();
}else{
	if(isset($_GET['t'])){
		$type = $_GET['t'];
		if($type == "default_M"){
			$md5 = md5_file("images/M.jpg");
			header('Content-Disposition: filename="Default_M.jpg"');
			header("Content-Type: image/jpeg");
			header("Last-Modified: $tsstring");
			header("ETag: $md5");
			readfile("images/M.jpg");
		}
		if($type == "default_F"){
			$md5 = md5_file("images/F.jpg");
			header('Content-Disposition: filename="Default_F.jpg"');
			header("Content-Type: image/jpeg");
			header("Last-Modified: $tsstring");
			header("ETag: $md5");
			readfile("images/F.jpg");
		}
		if($type == 'profile')
			if(isset($_GET['id']))
				if(is_numeric($_GET['id']))
					if(isset($_GET['h']))
						if(file_exists("images/image/{$_GET['h']}.bin") || file_exists("images/compressed/{$_GET['h']}.bin")){
							$md5 = $_GET['h'];
							$query = $conn->query(
								sprintf(
									"SELECT * FROM media WHERE media_hash = '%s' AND media_id = %d",
									$conn->real_escape_string($md5),
									$conn->real_escape_string($_GET['id'])
								)
							);
							if($query->num_rows > 0){
								$fetch = $query->fetch_assoc();
								if($compressed){
									$fetch['media_ext'] = "jpg";
									$fetch['media_format'] = "image/jpeg";
								}
								header('Content-Disposition: filename="'.$md5.'.'.$fetch['media_ext'].'"');
								header("Content-Type: {$fetch['media_format']}");
								header("Last-Modified: $tsstring");
								header("ETag: $md5");
								if($compressed)
									readfile("images/compressed/$md5.bin");
								else
									readfile("images/image/$md5.bin");
							}
						}
		if($type == "media")
			if(isset($_GET['id']))
				if(is_numeric($_GET['id']))
					if(isset($_GET['h']))
						if(file_exists("images/image/{$_GET['h']}.bin") || file_exists("images/compressed/{$_GET['h']}.bin")){
							$md5 = $_GET['h'];
							$query = $conn->query(
								sprintf(
									"SELECT * FROM media WHERE media_hash = '%s' AND media_id = %d",
									$conn->real_escape_string($md5),
									$conn->real_escape_string($_GET['id'])
								)
							);
							if($query->num_rows > 0){
								$fetch = $query->fetch_assoc();
								if($compressed){
									$fetch['media_ext'] = "jpg";
									$fetch['media_format'] = "image/jpeg";
								}
								header('Content-Disposition: filename="'.$md5.'.'.$fetch['media_ext'].'"');
								header("Content-Type: {$fetch['media_format']}");
								header("Last-Modified: $tsstring");
								header("ETag: $md5");
								if($compressed)
									readfile("images/compressed/$md5.bin");
								else
									readfile("images/image/$md5.bin");
							}
						}
	}
}
?>
