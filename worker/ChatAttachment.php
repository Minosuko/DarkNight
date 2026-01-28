<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Post.php';

if (!_is_session_valid()) {
    header("HTTP/1.1 401 Unauthorized");
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => 0, 'message' => 'Invalid request method']);
    exit();
}

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => 0, 'message' => 'No file uploaded']);
    exit();
}

$file = $_FILES['file'];
$filename = basename($file["name"]);
$filetype = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

// Validate type
$allowed_images = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];
$allowed_videos = ["webm", "mp4", "mpeg", "mov", "avi"];
$supported_ext = array_merge($allowed_images, $allowed_videos);

if (!in_array($filetype, $supported_ext)) {
    echo json_encode(['success' => 0, 'message' => 'Unsupported file type']);
    exit();
}

// Reuse the media handling logic from Post class
// We can call a private method if we make it public or just replicate the core logic
// For simplicity and since Chat might have different storage needs later, I'll use a specialized upload helper

try {
    $db = Database::getInstance();
    $db_media = $db->db_media;
    $mediaHash = md5_file($file["tmp_name"]);
    
    // Detect mime type
    $mediaFormat = '';
    if (function_exists('mime_content_type')) {
        $mediaFormat = mime_content_type($file["tmp_name"]);
    }
    
    $isImage = strpos($mediaFormat, 'image/') === 0;
    $isVideo = strpos($mediaFormat, 'video/') === 0;
    
    if (!$isImage && !$isVideo) {
         echo json_encode(['success' => 0, 'message' => 'Invalid file format']);
         exit();
    }

    $filePath = "";
    if ($isImage) {
        $filePath = __DIR__ . "/../data/images/image/$mediaHash.bin";
    } else {
        $filePath = __DIR__ . "/../data/videos/video/$mediaHash.bin";
    }

    $check = $db->query("SELECT media_id FROM $db_media.media WHERE media_hash = '$mediaHash'");
    $mediaId = 0;
    if ($check->num_rows == 0) {
        $db->query("INSERT INTO $db_media.media (media_format, media_hash, media_ext) VALUES ('$mediaFormat','$mediaHash', '$filetype')");
        $mediaId = $db->getLastId();
    } else {
        $mediaId = $check->fetch_assoc()["media_id"];
    }

    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    if (move_uploaded_file($file["tmp_name"], $filePath)) {
        echo json_encode([
            'success' => 1,
            'media_id' => $mediaId,
            'media_hash' => $mediaHash,
            'media_format' => $mediaFormat,
            'is_video' => $isVideo
        ]);
    } else {
        echo json_encode(['success' => 0, 'message' => 'Failed to save file']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => 0, 'message' => $e->getMessage()]);
}
