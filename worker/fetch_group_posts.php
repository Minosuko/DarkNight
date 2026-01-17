<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit;
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

$group_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$limit = 10;

if ($group_id <= 0) {
    echo json_encode(['success' => 0, 'message' => 'Invalid group ID']);
    exit;
}

$group = new Group($conn);
$group_info = $group->getInfo($group_id, $user_id);

if (!$group_info) {
    echo json_encode(['success' => 0, 'message' => 'Group not found']);
    exit;
}

// Security Check: If group is Secret or Closed, check membership
if ($group_info['group_privacy'] < 2) {
    if (!$group->isMember($group_id, $user_id)) {
        echo json_encode(['success' => 0, 'message' => 'Access denied. You must be a member to view posts.']);
        exit;
    }
}

$post_ids = $group->getPosts($group_id, $limit, $offset);

// Convert post IDs to full post data using fetch_post mechanism logic
// For simplicity in this step, we just return the IDs or a list of posts
// Usually we want to reuse the same structure as timeline.
// We'll mimic timeline behavior here.

$posts_data = [];
$i = 0;
foreach ($post_ids as $pid) {
    $p_info = Post::getPost($pid, $user_id);
    if ($p_info) {
        $posts_data[$i] = $p_info;
        $i++;
    }
}

$posts_data['success'] = 1;
echo json_encode($posts_data);
?>
