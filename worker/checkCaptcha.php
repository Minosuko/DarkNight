<?php
session_start();
if(!isset($_POST['capcha']) || !isset($_SESSION['captcha_code']))
	die("0");
echo $_POST['capcha'] == $_SESSION['captcha_code'] ? 1 : 0;
?>