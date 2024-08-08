<?php
require_once '../includes/functions.php';
if (!_is_session_valid())
    header("location:../index.php");
header("content-type: application/json");
$data = _get_data_from_token();
$row_d = [];
$row_d['user_gender'] = $data['user_gender'];
$row_d['pfp_media_id'] = $data['pfp_media_id'];
$row_d['cover_media_id'] = $data['cover_media_id'];
$row_d['pfp_media_hash'] = ($data['pfp_media_id'] > 0) ? _get_hash_from_media_id($data['pfp_media_id']) : null;
$row_d['cover_media_hash'] = ($data['cover_media_id'] > 0) ? _get_hash_from_media_id($data['cover_media_id']) : null;
$row_d["success"] = 1;
echo json_encode($row_d);
?>