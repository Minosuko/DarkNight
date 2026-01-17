<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

$data = _get_data_from_token();
header("content-type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['type']) && isset($_POST['query'])) {
        $type = intval($_POST['type']);
        $key = $_POST['query'];
        $page = 0;
        
        if (isset($_GET['page']) && is_numeric($_GET['page'])) {
            $page = $_GET['page'];
        }

        if (in_array($type, [0, 2, 3])) {
            // User Search
            $rows = Search::users($key, $type, $data['user_id'], $page);
            if (empty($rows)) {
                echo '{"success":2}';
            } else {
                $rows["success"] = 1;
                echo json_encode($rows); // Search::users returns formatted rows with success flag now
            }
        } elseif ($type == 4) {
            // Group Search
            $rows = Search::groups($key, $data['user_id'], $page);
            if (empty($rows)) {
                echo '{"success":2}';
            } else {
                $rows["success"] = 1;
                echo json_encode($rows);
            }
        } else {
            // Post Search
            $filters = [
                'scope' => $_POST['scope'] ?? 'all',
                'privacy' => $_POST['privacy'] ?? 'all',
                'start_date' => $_POST['start_date'] ?? null,
                'end_date' => $_POST['end_date'] ?? null,
                'group_id' => $_POST['group_id'] ?? 0
            ];
            $feed = Post::searchPosts($key, $data['user_id'], $page, $filters);
            if (empty($feed)) {
                echo '{"success":2}';
            } else {
                $formatted = [];
                $i = 0;
                foreach ($feed as $row) {
                    $post = [
                        'post_id' => $row['post_id'],
                        'post_caption' => Utils::captionTrim($row['post_caption']),
                        'post_time' => $row['post_time'],
                        'post_public' => $row['post_public'],
                        'post_by' => $row['post_by'],
                        'post_media' => $row['post_media'],
                        'is_share' => $row['is_share'],
                        
                        'user_firstname' => $row['user_firstname'],
                        'user_lastname' => $row['user_lastname'],
                        'user_id' => $row['user_id'],
                        'user_gender' => $row['user_gender'],
                        'pfp_media_id' => $row['pfp_media_id'],
                        'user_nickname' => $row['user_nickname'],
                        'verified' => $row['verified'],
                        
                        'is_liked' => $row['is_liked'] > 0 ? 1 : 0,
                        'total_like' => $row['total_like'],
                        'total_comment' => $row['total_comment'],
                        'total_share' => $row['total_share']
                    ];

                    if (!empty($row['post_media_list'])) {
                        $post['post_media_list'] = $row['post_media_list'];
                        
                         $mediaItems = explode(',', $row['post_media_list']);
                         if (count($mediaItems) > 0) {
                             $first = explode(':', $mediaItems[0]);
                             if (count($first) >= 3) {
                                 $post['media_hash'] = $first[1];
                                 $post['media_format'] = $first[2];
                                 $post['is_video'] = (substr($first[2], 0, 5) == 'video');
                             }
                         }
                    } elseif ($row['post_media'] != 0) {
                        $post['media_hash'] = isset($row['post_media_hash']) ? $row['post_media_hash'] : '';
                        $post['media_format'] = isset($row['post_media_format']) ? $row['post_media_format'] : '';
                        $post['is_video'] = (isset($row['post_media_format']) && substr($row['post_media_format'], 0, 5) == 'video');
                    }

                    if ($row['pfp_media_id'] != 0) {
                        $post['pfp_media_hash'] = $row['pfp_media_hash'];
                    }

                    if ($row['is_share'] != 0) {
                         // Search results logic for shared posts visibility
                         $s_public = $row['shared_public'];
                         $s_by = $row['shared_by_id'];
                         $canView = true;
                         if ($s_public == '0' || $s_public == '1') {
                            if ($s_by == $data['user_id']) {
                                $canView = true;
                            } else {
                                if ($s_public == '1' && $row['is_friend_with_shared'] > 0) {
                                    $canView = true;
                                } elseif ($s_public == '0' && $s_by == $data['user_id']) {
                                    $canView = true;
                                } else {
                                    $canView = false;
                                }
                            }
                        } else {
                            $canView = true;
                        }

                        $post['share'] = [];
                        $post['share']['pflag'] = $canView;
                        $post['share']['post_by'] = $s_by;
                        $post['share']['post_public'] = $s_public;
                        
                        $post['share']['user_id'] = $row['shared_by_id']; 
                        $post['share']['pfp_media_id'] = $row['shared_pfp_id'];
                        $post['share']['user_firstname'] = $row['shared_firstname'];
                        $post['share']['user_lastname'] = $row['shared_lastname'];
                        $post['share']['user_nickname'] = $row['shared_nickname'];
                        $post['share']['user_gender'] = $row['shared_gender'];
                        $post['share']['verified'] = $row['shared_verified'];
                        
                        $post['share']['post_caption'] = Utils::captionTrim($row['shared_caption']);
                        $post['share']['post_time'] = $row['shared_time'];
                        $post['share']['post_media'] = $row['shared_media'];
                        
                         if (!empty($row['shared_media_list'])) {
                            $post['share']['post_media_list'] = $row['shared_media_list'];
                             $mediaItems = explode(',', $row['shared_media_list']);
                             if (count($mediaItems) > 0) {
                                 $first = explode(':', $mediaItems[0]);
                                 if (count($first) >= 3) {
                                     $post['share']['media_hash'] = $first[1];
                                     $post['share']['media_format'] = $first[2];
                                     $post['share']['is_video'] = (substr($first[2], 0, 5) == 'video');
                                 }
                             }
                        } elseif ($row['shared_media'] != 0) {
                            $post['share']['media_hash'] = isset($row['shared_media_hash']) ? $row['shared_media_hash'] : '';
                            $post['share']['media_format'] = isset($row['shared_media_format']) ? $row['shared_media_format'] : '';
                            $post['share']['is_video'] = (isset($row['shared_media_format']) && substr($row['shared_media_format'], 0, 5) == 'video');
                        }
                        
                         if ($row['shared_pfp_id'] != 0) {
                            $post['share']['pfp_media_hash'] = $row['shared_pfp_hash'];
                        }
                    }
                    
                    $formatted[$i] = $post;
                    $i++;
                }
                $formatted["success"] = 1;
                echo json_encode($formatted);
            }
        }
    }
}
?>
