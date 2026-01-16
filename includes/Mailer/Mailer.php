<?php
require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer{
	function __construct($host, $port, $secure, $auth, $username, $password){
		$smtp = 
			[
				'host' => $host,
				'port' => $port,
				'secure' => $secure,
				'auth' => $auth,
				'username' => $username,
				'password' => $password
			];
		$this->smtp = $smtp;
	}
	function send($to, $subject, $body, $header = ['isHTML' => false, 'From' => 'PHPMailer', 'to' => 'PHPMailerToUser']){
		$smtp = $this->smtp;
		$mail = new PHPMailer();
		$mail->IsSMTP();
		$mail->SMTPDebug  = 0;  
		$mail->SMTPAuth   = $smtp['auth'];
		$mail->SMTPSecure = $smtp['secure'];
		$mail->Port       = $smtp['port'];
		$mail->Host       = $smtp['host'];
		$mail->Username   = $smtp['username'];
		$mail->Password   = $smtp['password'];
		$mail->AddAddress($to, $header['to']);
		$mail->SetFrom($smtp['username'], $header['From']);
		$mail->Subject    = $subject;
		$mail->CharSet    = "UTF-8";
		$content = $body;
		if($header['isHTML'] == true){
			$mail->IsHTML($header['isHTML']);
			$mail->MsgHTML($content);
		}
		return $mail->send();
	}
}