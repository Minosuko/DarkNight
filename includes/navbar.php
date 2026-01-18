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
if(substr($_SERVER['REQUEST_URI'],0,10) == '/includes/') die();
?>
<script src="resources/js/jquery.js"></script>
<script src="resources/js/highlight.js"></script>
<div id="hljs_lang_list"></div>
<nav class="usernav">
    <div id="loading_bar"></div>
    <ul>

        <li><a href="/search.php" onclick="changeUrl('/search.php'); return false;" title="Search"><i class="fa-solid fa-magnifying-glass"></i></a></li>
        <li><a href="/friends.php" onclick="changeUrl('/friends.php'); return false;" title="Friends"><i class="fa-solid fa-user-group"></i></a></li>
        <li><a href="/groups.php" onclick="changeUrl('/groups.php'); return false;" title="Groups"><i class="fa-solid fa-users"></i></a></li>
        <li><a href="/home.php" class="active" onclick="changeUrl('/home.php'); return false;" title="Home"><i class="fa-solid fa-house"></i></a></li>
        <li><a href="/profile.php" onclick="changeUrl('/profile.php'); return false;" title="Profile"><i class="fa-solid fa-user"></i></a></li>
        <li>
            <a href="/notification.php" onclick="changeUrl('/notification.php'); return false;" title="Notification">
                <i class="fa-solid fa-bell"></i>
                <span class="red-dot-counter" id="notification_count" style="display:none;">0</span>
            </a>
        </li>
        <li><a href="/settings.php" onclick="changeUrl('/settings.php'); return false;" title="Settings"><i class="fa-solid fa-gear"></i></a></li>
    </ul>
</nav>

<div id="modal" class="modal">
    <div class="modal-content" id="modal_content"></div>
</div>

<script src="resources/js/zTemplate.js"></script>
<script src="resources/js/cropper.js"></script>
<script src="resources/js/jquery-cropper.js"></script>
<script src="resources/js/main.js"></script>
<input id='fullname' value='Unkown' type='hidden'>
<input id='online_status' value='1' type='hidden'>

<script>
document.addEventListener("DOMContentLoaded", function() {
    // Initial active state check handled by main.js updateActiveNavbar calls if needed, 
    // but on hard reload main.js calls updateActiveNavbar in processAjaxData? No. 
    // We should keep the initial check or call the function from main.js.
    // Let's call the function from main.js.
    updateActiveNavbar(window.location.pathname);

    // Handle counters visibility
    var fCount = document.getElementById("friend_req_count");
    if(fCount && fCount.innerText != '0') fCount.style.display = 'block';
    
    var nCount = document.getElementById("notification_count");
    if(nCount && nCount.innerText != '0') nCount.style.display = 'block';
});
</script>
