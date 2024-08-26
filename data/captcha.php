<?php
session_start();
require_once("../includes/Captcha.php");
$Captcha = new Captcha();
$code = (isset($_SESSION['refresh_captcha']) && isset($_SESSION['captcha_code'])) ? ($_SESSION['refresh_captcha'] == 1 ? $Captcha->newCode() : $_SESSION['captcha_code']) : $Captcha->newCode();
$Captcha->phpcaptcha('#ff6600','#fff',120,40,10,25,'#0066ff', $code);     
?>