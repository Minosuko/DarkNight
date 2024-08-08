<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
	header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	if (isset($_GET['id'])) {
		if (is_numeric($_GET['id'])) {
			if (isset($_GET['accept'])) {
				$sql = "UPDATE friendship
						SET friendship.friendship_status = 1
						WHERE friendship.user1_id = {$_GET['id']} AND friendship.user2_id = {$data['user_id']}";
			} else if(isset($_GET['ignore'])) {
				$sql = "DELETE FROM friendship
						WHERE friendship.user1_id = {$_GET['id']} AND friendship.user2_id = {$data['user_id']}";
				
			}
			if(isset($sql)){
				$query = $conn->query($sql);
				if($query)
					exit("{\"success\":1,\"id\":{$_GET['id']}}");
			}
		}
	}
}
echo '{"success":-1}';
?>