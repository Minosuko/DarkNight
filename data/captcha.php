<?php
session_start();
require_once("../includes/Captcha.php");  
$phptextObj = new Captcha();
$phptextObj->phpcaptcha('#ff6600','#fff',120,40,10,25,'#0066ff');      
?>