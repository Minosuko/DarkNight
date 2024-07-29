<?php
require_once '../includes/functions.php';
$compressed = true;
if(isset($_GET['original']))
	$compressed = false;
if(isset($_GET['id']) && isset($_GET['h'])){
	$hash = _trim_hash($_GET['h']);
	if(file_exists("videos/video/$hash.bin") || file_exists("videos/compressed/$hash.bin")){
		if(file_exists("videos/compressed/$hash.bin") && $compressed){
			$fdate = filemtime("videos/compressed/$hash.bin");
			$etag = md5_file("videos/compressed/$hash.bin");
			$fsize = filesize("videos/compressed/$hash.bin");
		}else{
			$fdate = filemtime("videos/video/$hash.bin");
			$etag = md5_file("videos/video/$hash.bin");
			$fsize = filesize("videos/video/$hash.bin");
		}
	}else{
		$fdate = time();
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
		if(isset($_GET['id']) && isset($_GET['h'])){
			if(is_numeric($_GET['id'])){
				if(file_exists("videos/video/$hash.bin") || file_exists("videos/compressed/$hash.bin")){
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
						header('Content-Disposition: filename="'.$md5.'.'.$fetch['media_ext'].'"');
						header("Content-Type: {$fetch['media_format']}");
						header("Content-Encoding: identity");
						header('Expires: 0');
						header('Cache-Control: must-revalidate');
						header('Pragma: public');
						header("Last-Modified: $tsstring");
						header("ETag: $md5");
						header("Content-Length: $fsize");
						if(substr($fetch['media_format'],0,5)=='video'){
							if($compressed && file_exists("videos/compressed/$hash.bin"))
								video_stream("images/compressed/$md5.bin");
							else
								video_stream("videos/video/$md5.bin");
						}
					}
				}
			}
		}
	}
}
?>
