<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    $postId = isset($_POST['post_id']) ? $_POST['post_id'] : '';

    if (empty($action) || empty($postId)) {
        echo json_encode(["success" => 0, "err" => "Missing parameters"]);
        exit();
    }

    switch ($action) {
        case 'delete':
            $response = Post::delete($postId, $user_id);
            echo json_encode($response);
            break;
        case 'update':
            $caption = isset($_POST['caption']) ? $_POST['caption'] : '';
            $public = isset($_POST['private']) ? $_POST['private'] : 2; // Default to public
            $response = Post::update($postId, $user_id, $caption, $public);
            echo json_encode($response);
            break;
        case 'pin':
            $response = Post::togglePin($postId, $user_id);
            echo json_encode($response);
            break;
        default:
            echo json_encode(["success" => 0, "err" => "Invalid action"]);
            break;
    }
} else {
    echo json_encode(["success" => 0, "err" => "Invalid request method"]);
}
?>
