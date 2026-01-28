<?php
session_start();
require_once("../includes/Captcha.php");
$Captcha = new Captcha();
$code = (isset($_SESSION['refresh_captcha']) && isset($_SESSION['captcha_code'])) ? ($_SESSION['refresh_captcha'] == 1 ? $Captcha->newCode() : $_SESSION['captcha_code']) : $Captcha->newCode();
$Captcha->phpcaptcha('#007bff','#0f0f0f',120,40,5,15,'#333333', $code);     
?>