<?php
session_start();
if(!isset($_POST['captcha']) || !isset($_SESSION['captcha_code']))
	die("0");
echo $_POST['captcha'] == $_SESSION['captcha_code'] ? 1 : 0;
?>