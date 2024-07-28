<?php
require_once '../includes/functions.php';
$compressed = true;
if(isset($_GET['original']))
	$compressed = false;
if(isset($_GET['id']) && isset($_GET['h'])){
	$hash = _trim_hash($_GET['h']);
	if(file_exists("images/image/$hash.bin") || file_exists("images/compressed/$hash.bin")){
		if($compressed && !file_exists("images/compressed/$hash.bin"))
			file_put_contents("images/compressed/$hash.bin",compress_image("images/image/$hash.bin"));
		if(file_exists("images/compressed/$hash.bin") && $compressed){
			$fdate = filemtime("images/compressed/$hash.bin");
			$etag = md5_file("images/compressed/$hash.bin");
			$fsize = filesize("images/compressed/$hash.bin");
		}else{
			$fdate = filemtime("images/image/$hash.bin");
			$etag = md5_file("images/image/$hash.bin");
			$fsize = filesize("images/image/$hash.bin");
		}
	}else{
		$fdate = time();
	}
}elseif(isset($_GET['t'])){
	$type = $_GET['t'];
	if($type == "default_M"){
		$etag = md5_file("images/M.jpg");
		$fdate = filemtime("images/M.jpg");
		$fsize = filesize("images/M.jpg");
	}
	if($type == "default_F"){
		$etag = md5_file("images/F.jpg");
		$fdate = filemtime("images/F.jpg");
		$fsize = filesize("images/F.jpg");
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
			header("Content-Length: $fsize");
			readfile("images/M.jpg");
		}elseif($type == "default_F"){
			$md5 = md5_file("images/F.jpg");
			header('Content-Disposition: filename="Default_F.jpg"');
			header("Content-Type: image/jpeg");
			header("Last-Modified: $tsstring");
			header("ETag: $md5");
			header("Content-Length: $fsize");
			readfile("images/F.jpg");
		}else{
			if(isset($_GET['id']) && isset($_GET['h'])){
				if(is_numeric($_GET['id'])){
					if(file_exists("images/image/$hash.bin") || file_exists("images/compressed/$hash.bin")){
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
							header("Content-Length: $fsize");
							if(substr($fetch['media_format'],0,5)!='video'){
								if($compressed)
									readfile("images/compressed/$md5.bin");
								else
									readfile("images/image/$md5.bin");
							}
						}
					}
				}
			}
		}
	}
}
?>
