<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

$data = _get_data_from_token();
header("content-type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['caption'])) { // Removed private check as strictly required, defaulted in class but let's parse it here
        $caption = $_POST['caption'];
        $public = 2; // Default
        
        if (isset($_POST['private'])) {
             if ($_POST['private'] == "0") $public = 0;
             elseif ($_POST['private'] == "1") $public = 1;
        }

        $fileData = isset($_FILES['fileUpload']) ? $_FILES['fileUpload'] : null;
        
        $response = Post::create($data['user_id'], $caption, $public, $fileData);
        echo json_encode($response);
    }
}
?>
