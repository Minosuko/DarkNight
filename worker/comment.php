<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
$data = _get_data_from_token();
if(isset($_GET['id'])){
	if(is_numeric($_GET['id'])){
		if(isset($_POST['comment']) && isset($_GET['id'])){
			$comment = $_POST['comment'];
			$post_id = $_GET['id'];
			$user_id = $data['user_id'];
			if(!is_post_exists($post_id)) die('{"success":-1}');
			$postinfo = getInfoPostID($post_id);
			if($postinfo['allow_comment'] == 0) die('{"success":-1}');
			$cf = $GLOBALS['commandfunc'];
			$cf->setUserData($data);
			if($cf->allowUseCommand()){
				$isCommand = $cf->parse_command($comment);
				if(is_array($isCommand)){
					switch(strtolower($isCommand[0])){
						case 'verify':
							$c = $cf->execute($isCommand[0],$isCommand[1],$postinfo['post_by']);
							break;
						case 'allow_comment':
							$c = $cf->execute($isCommand[0],$isCommand[1],$post_id);
							break;
					}
					die('{"success":1,"c":'.($c ? 1 : 0).'}');
				}
			}
			$sql = "INSERT INTO `comments` (`post_id`, `user_id`, `comment`, `comment_time`) VALUES ('$post_id', '$user_id', '" . $conn->real_escape_string($comment) . "', '$timestamp')";
			$query = $conn->query($sql);
			if($query){
				// TRIGGER NOTIFICATION
				require_once '../includes/classes/Notification.php';
				$notif = new Notification();
				$notif->create($postinfo['post_by'], $user_id, 'comment', $post_id);
				
				echo '{"success":1}';
			}
		}
	}
}
?>