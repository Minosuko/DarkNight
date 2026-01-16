<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
$data = _get_data_from_token();
if(isset($_GET['post_id'])){
	$id = $_GET['post_id'];
	if(is_numeric($id)){
		if(is_post_exists($id)){
			$query = $conn->query("SELECT * FROM likes WHERE user_id = {$data['user_id']} AND post_id = $id");
			if($query->num_rows > 0){
				$query = $conn->query("DELETE FROM likes WHERE user_id = {$data['user_id']} AND post_id = $id");
				echo "0;".total_like($id);
			}else{
				$query = $conn->query("INSERT INTO likes (user_id, post_id) VALUES ({$data['user_id']}, $id)");
				
				// TRIGGER NOTIFICATION
				require_once '../includes/classes/Notification.php';
				$notif = new Notification();
				// Get post owner
				$postOwnerQuery = $conn->query("SELECT post_by FROM posts WHERE post_id = $id");
				if ($postOwnerQuery && $postOwnerQuery->num_rows > 0) {
					$postOwnerId = $postOwnerQuery->fetch_assoc()['post_by'];
					$notif->create($postOwnerId, $data['user_id'], 'like', $id);
				}
				
				echo "1;".total_like($id);
			}
		}
	}
}
?>