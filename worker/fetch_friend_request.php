<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();

$page = 0;
if (isset($_GET['page']) && is_numeric($_GET['page'])) {
    $page = $_GET['page'];
}

$requests = Friend::getRequests($data['user_id'], $page);

if (empty($requests)) {
    echo '{"success":2}';
} else {
    $formatted = [];
    $i = 0;
    foreach ($requests as $row) {
        $formatted[$i] = $row;
        // pfp_media_hash is already present
        $i++;
    }
    $formatted["success"] = 1;
    echo json_encode($formatted);
}
?>