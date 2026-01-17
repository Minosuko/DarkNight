<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
$id = -1;
if(isset($_GET['id']))
	if(is_numeric($_GET['id']))
		$id = $_GET['id'];
$post = Post::getPost($id, $data['user_id']);

if (!$post) {
    echo '{"success":2}';
} else {
    // Robust media mapping
    if (!empty($post['post_media_list'])) {
        $mediaItems = explode(',', $post['post_media_list']);
        if (count($mediaItems) > 0) {
            $first = explode(':', $mediaItems[0]);
            if (count($first) >= 3) {
                $post['media_hash'] = $first[1];
                $post['media_format'] = $first[2];
                $post['is_video'] = (substr($first[2], 0, 5) == 'video');
            }
        }
    } elseif ($post['post_media'] != 0) {
        $post['media_hash'] = isset($post['post_media_hash']) ? $post['post_media_hash'] : '';
        $post['media_format'] = isset($post['post_media_format']) ? $post['post_media_format'] : '';
        $post['is_video'] = (isset($post['post_media_format']) && substr($post['post_media_format'], 0, 5) == 'video');
    }

    // Shared post mapping
    if ($post['is_share'] != 0) {
        if (!empty($post['shared_media_list'])) {
            $mediaItems = explode(',', $post['shared_media_list']);
            if (count($mediaItems) > 0) {
                $first = explode(':', $mediaItems[0]);
                if (count($first) >= 3) {
                    $post['share_media_hash'] = $first[1];
                    $post['share_media_format'] = $first[2];
                    $post['share_is_video'] = (substr($first[2], 0, 5) == 'video');
                }
            }
        } elseif ($post['shared_media'] != 0) {
            $post['share_media_hash'] = isset($post['shared_media_hash']) ? $post['shared_media_hash'] : '';
            $post['share_media_format'] = isset($post['shared_media_format']) ? $post['shared_media_format'] : '';
            $post['share_is_video'] = (isset($post['shared_media_format']) && substr($post['shared_media_format'], 0, 5) == 'video');
        }
    }

    $post['is_mine'] = ($post['user_id'] == $data['user_id']) ? 1 : 0;
    $post['success'] = 1;
    echo json_encode($post);
}
?>