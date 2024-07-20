<?php
$md5 = md5_file($_SERVER["SCRIPT_FILENAME"]);
$tsstring = gmdate('D, d M Y H:i:s ', filemtime($_SERVER["SCRIPT_FILENAME"])) . 'GMT';
$if_modified_since = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? $_SERVER['HTTP_IF_MODIFIED_SINCE'] : false;
$if_none_match = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? $_SERVER['HTTP_IF_NONE_MATCH'] : false;
if ((($if_none_match && $if_none_match == $md5) || (!$if_none_match)) && ($if_modified_since && $if_modified_since == $tsstring))
{
    header('HTTP/1.1 304 Not Modified');
}else{
	header("Last-Modified: $tsstring");
	header("ETag: $md5");
}
if(!isset($IFI)) die("");
?>
<script src="resources/js/jquery.js"></script>
<script src="resources/js/highlight.js"></script>
<div id="hljs_lang_list"></div>
<div class="usernav">
	<center>
		<ul>
			<li><a href="/search.php" title="Settings"><i class="fa-solid fa-magnifying-glass"></i></a></li>
			<li><a href="/requests.php" title="Friend Requests" class="noft-align"><i class="fa-solid fa-user-plus"></i><span class="red-dot-counter" id="friend_req_count">0</span></a></li>
			<li><a href="/friends.php" title="Friends"><i class="fa-solid fa-user-group"></i></a></li>
			<li><a href="/home.php" title="Home"><i class="fa-solid fa-house"></i></a></li>
			<li><a href="/profile.php" title="Profile"><i class="fa-solid fa-user"></i></a></li>
			<li><a href="/notification.php" title="Notification" class="noft-align"><i class="fa-solid fa-bell"></i><span class="red-dot-counter" id="notification_count">0</span></a></li>
			<li><a href="/settings.php" title="Settings"><i class="fa-solid fa-gear"></i></a></li>
		</ul>
	</center>
</div>
<script src="resources/js/main.js"></script>
<script src="resources/js/cropper.js"></script>
<script src="resources/js/jquery-cropper.js"></script>
<script>
function validateField(){
    var query = document.getElementById("query");
    var button = document.getElementById("querybutton");
    if(query.value == "") {
        query.placeholder = 'Type something!';
        return false;
    }
    return true;
}
</script>
<?php
echo "<input id='fullname' value='".htmlspecialchars($data['user_firstname'] . ' ' . $data['user_lastname'])."' type='hidden'>";
echo "<input id='online_status' value='".$data['online_status']."' type='hidden'>";
?>
<div id="modal" class="modal">
	<div class="modal-content" id="modal-content">
		<a class="close" onclick="modal_close()">&times;</a>
		<div id="modal_content"></div>
	</div>
</div>