<?php
require_once "includes/functions.php";
_setcookie("token","",-1);
_setcookie("session_token","",-1);
_setcookie("session_id","",-1);
_setcookie("access_token","",-1);
header("location:index.php");
?>