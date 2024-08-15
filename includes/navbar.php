<?php
header("Connection: keep-alive");
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
if(substr($_SERVER['REQUEST_URI'],0,10) == '/includes/') die($_SERVER['REQUEST_URI']);
?>
<script src="resources/js/jquery.js"></script>
		<script src="resources/js/highlight.js"></script>
		<div id="hljs_lang_list"></div>
		<div class="usernav">
			<center>
				<div id="loading_bar"></div>
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
		<script src="resources/js/zTemplate.js"></script>
		<script src="resources/js/cropper.js"></script>
		<script src="resources/js/jquery-cropper.js"></script>
		<script src="resources/js/main.js"></script>
		<input id='fullname' value='Unkown' type='hidden'>
		<input id='online_status' value='1' type='hidden'>
		<div id="modal" class="modal">
			<div class="modal-content" id="modal-content">
				<a class="close" onclick="modal_close()">&times;</a>
				<div id="modal_content"></div>
			</div>
		</div>
