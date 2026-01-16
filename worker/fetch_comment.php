<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();

$id = -1;
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $id = $_GET['id'];
}

$page = 0;
if (isset($_GET['page']) && is_numeric($_GET['page'])) {
    $page = $_GET['page'];
}

$comments = Comment::getComments($id, $page);

if (empty($comments)) {
    echo '{"success":2}';
} else {
    $formatted = [];
    $i = 0;
    foreach ($comments as $row) {
        $formatted[$i] = $row; // The query already formats mostly correct, but let's check media hash
        if ($formatted[$i]['pfp_media_id'] != 0) {
             // In Comment.php we already joined media table to get pfp_media_hash
             // So it's already there
        }
        $i++;
    }
    $formatted["success"] = 1;
    echo json_encode($formatted);
}
?>