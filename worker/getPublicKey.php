<?php
require_once '../includes/functions.php';
header("content-type: application/json");
if(isset($_COOKIE['browser_id'])){
	$id = $_COOKIE['browser_id'];
	if(!$LEA->PrivateKeyExists($id)){
		_setcookie('browser_id','',(86400*365*15*-1));
		header("Location: ../?refresh_key");
		die();
	}
}
$pubKey = $LEA->privateKeyToPublicKey($LEA->getPrivateKey($id));
echo json_encode(['PublicKey'=>$pubKey,"EncryptionKey"=>$LEA_encryptionKey]);
?>