<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();
$viewer_id = $data['user_id'];
$target_id = $viewer_id;

if (isset($_GET['id'])) {
    if ($_GET['id'] != $viewer_id && is_numeric($_GET['id'])) {
        $target_id = $_GET['id'];
    }
}

if (!User::exists($target_id)) {
    $target_id = $viewer_id;
}

$page = 0;
if (isset($_GET['page']) && is_numeric($_GET['page'])) {
    $page = $_GET['page'];
}

$media = Post::getProfileMedia($target_id, $viewer_id, $page);

if (empty($media)) {
    echo '{"success":' . (($page > 0) ? '3' : 2) . '}';
} else {
    $formatted = [];
    $i = 0;
    foreach ($media as $row) {
        $item = [
            'post_id' => $row['post_id'],
            'media_id' => $row['media_id'],
            'media_hash' => $row['media_hash'],
            'media_format' => $row['media_format'],
            'is_video' => (substr($row['media_format'], 0, 5) == 'video'),
            'is_spoiler' => intval($row['is_spoiler']),
            'media_count' => isset($row['media_count']) ? intval($row['media_count']) : 1
        ];
        $formatted[$i] = $item;
        $i++;
    }
    $formatted["success"] = 1;
    echo json_encode($formatted);
}
?>
