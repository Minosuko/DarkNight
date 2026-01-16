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

$friends = Friend::getList($data['user_id'], $page);

if (empty($friends)) {
    // Original logic: echo '{"success":' . (($off >= 20) ? '3' : 2) . '}';
    // If page > 0 and empty, it's end of list (3), else empty (2)
    echo '{"success":' . (($page > 0) ? '3' : 2) . '}';
} else {
    $formatted = [];
    $i = 0;
    foreach ($friends as $row) {
        $formatted[$i] = $row;
        // is_online logic: last_online is retrieved in query
        $lastOnline = $row['last_online'];
        $formatted[$i]['is_online'] = (time() - $lastOnline <= 600) ? 1 : 0;
        // pfp_media_hash is already correctly named in the query
        $i++;
    }
    $formatted["success"] = 1;
    echo json_encode($formatted);
}
?>