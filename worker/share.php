<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

$data = _get_data_from_token();
header("content-type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['post_id']) && isset($_POST['caption'])) {
        $postId = intval($_POST['post_id']);
        $caption = $_POST['caption'];
        $public = 2; // Default
        
        if (isset($_POST['private'])) {
             if ($_POST['private'] == "0") $public = 0;
             elseif ($_POST['private'] == "1") $public = 1;
        }

        $fileData = isset($_FILES['fileUpload']) ? $_FILES['fileUpload'] : null;
        
        $response = Post::share($data['user_id'], $postId, $caption, $public, $fileData);
        echo json_encode($response);
    }
}
?>