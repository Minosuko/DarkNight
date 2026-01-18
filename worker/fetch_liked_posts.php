<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    die('[]');
}

header("content-type: application/json");

$data = _get_data_from_token();
$page = isset($_GET['page']) ? intval($_GET['page']) : 0;
$viewerId = $data['user_id'];

// Get posts
$posts = Post::getLikedPosts($viewerId, $page);

// Format posts using existing structure (similar to fetch_post.php but simplified)
$result = [];
foreach ($posts as $post) {
    // Process media list
    $processedMedia = [];
    if (!empty($post['post_media_list'])) {
        $mediaItems = explode(',', $post['post_media_list']);
        foreach ($mediaItems as $item) {
            $parts = explode(':', $item, 3); // Limit to 3 parts: id, hash, format
            if (count($parts) >= 2) { // Need at least id and hash
                $processedMedia[] = [
                    'media_id' => $parts[0],
                    'media_hash' => $parts[1],
                    'media_format' => isset($parts[2]) ? $parts[2] : ''
                ];
            }
        }
    }
    $post['post_media'] = $processedMedia;

    // Process shared media list
    $processedSharedMedia = [];
    if (!empty($post['shared_media_list'])) {
        $mediaItems = explode(',', $post['shared_media_list']);
        foreach ($mediaItems as $item) {
            $parts = explode(':', $item, 3);
            if (count($parts) >= 2) {
                $processedSharedMedia[] = [
                    'media_id' => $parts[0],
                    'media_hash' => $parts[1],
                    'media_format' => isset($parts[2]) ? $parts[2] : ''
                ];
            }
        }
    }
    $post['shared_media'] = $processedSharedMedia;

    $result[] = $post;
}

echo json_encode($result);
?>
