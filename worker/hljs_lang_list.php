<?php
$md5 = md5_file($_SERVER["SCRIPT_FILENAME"]);
$tsstring = gmdate('D, d M Y H:i:s ', filemtime($_SERVER["SCRIPT_FILENAME"])) . 'GMT';
$if_modified_since = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? $_SERVER['HTTP_IF_MODIFIED_SINCE'] : false;
$if_none_match = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? $_SERVER['HTTP_IF_NONE_MATCH'] : false;
if ((($if_none_match && $if_none_match == $md5) || (!$if_none_match)) && ($if_modified_since && $if_modified_since == $tsstring))
{
    header('HTTP/1.1 304 Not Modified');
	die();
}else{
	header("Last-Modified: $tsstring");
	header("ETag: \"{$md5}\"");
}
header("content-type: application/json");
$s = scandir(__DIR__ . '/../resources/js/highlight/');
$sl = [];
unset($s[0],$s[1]);
foreach($s as $hljs)
	$sl[] = $hljs;
echo json_encode($sl);
?>