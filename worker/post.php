<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
header("content-type: application/json");

// Fetch viewer birthday for age verification
global $db_user;
$viewer_info = $conn->query("SELECT user_birthdate FROM $db_user.users WHERE user_id = $user_id")->fetch_assoc();
$viewer_birthdate = $viewer_info['user_birthdate'] ?? '';
$viewer_age = _get_age($viewer_birthdate);

// --- Helper Function for Formatting Posts ---
function formatPosts($feed, $viewer_id, $viewer_age = 18) {
    if (empty($feed)) {
        return ['success' => 2];
    }
    
    $formatted = [];
    $i = 0;
    foreach ($feed as $row) {
        $is_spoiler = isset($row['is_spoiler']) ? (int)$row['is_spoiler'] : 0;
        
        // Safety: If viewer is under 18 and content is NSFW (spoiler), hide it completely
        if ($viewer_age < 18 && $is_spoiler == 1) {
            continue;
        }

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
            'total_share' => $row['total_share'],
            'is_mine' => ($row['user_id'] == $viewer_id) ? 1 : 0,
            'is_pinned' => isset($row['is_pinned']) ? $row['is_pinned'] : 0,
            'is_spoiler' => $is_spoiler,
            'group_id' => isset($row['group_id']) ? $row['group_id'] : 0,
            'group_name' => isset($row['group_name']) ? $row['group_name'] : null,
            'group_verified' => isset($row['group_verified']) ? $row['group_verified'] : 0,
            
            'can_delete' => isset($row['can_delete']) ? $row['can_delete'] : (($row['user_id'] == $viewer_id) ? 1 : 0),
            'can_pin' => isset($row['can_pin']) ? $row['can_pin'] : 0,
            
            'user_birthdate' => isset($row['user_birthdate']) ? $row['user_birthdate'] : 0,
            'user_hometown' => isset($row['user_hometown']) ? $row['user_hometown'] : '',
            'user_status' => isset($row['user_status']) ? $row['user_status'] : '',
            'user_about' => isset($row['user_about']) ? $row['user_about'] : '',
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
            $canView = false;
            $s_public = $row['shared_public'];
            $s_by = $row['shared_by_id'];
            
            if ($s_public == '0' || $s_public == '1') {
                if ($s_by == $viewer_id) {
                    $canView = true;
                } else {
                    if ($s_public == '1' && $row['is_friend_with_shared'] > 0) {
                        $canView = true;
                    }
                    if ($s_public == '0' && $s_by == $viewer_id) {
                        $canView = true;
                    }
                }
            } else {
                $canView = true;
            }

            $s_spoiler = isset($row['shared_spoiler']) ? (int)$row['shared_spoiler'] : 0;
            
            // Safety: If viewer is under 18 and shared content is NSFW, hide the whole post
            if ($viewer_age < 18 && $s_spoiler == 1) {
                continue;
            }

            $post['share'] = [];
            $post['share']['pflag'] = $canView;
            $post['share']['post_id'] = $row['is_share'];
            $post['share']['post_by'] = $s_by;
            $post['share']['post_public'] = $s_public;
            
            $post['share']['user_id'] = $row['shared_by_id']; 
            $post['share']['pfp_media_id'] = $row['shared_pfp_id'];
            $post['share']['user_firstname'] = $row['shared_firstname'];
            $post['share']['user_lastname'] = $row['shared_lastname'];
            $post['share']['user_nickname'] = $row['shared_nickname'];
            $post['share']['user_gender'] = $row['shared_gender'];
            $post['share']['verified'] = $row['shared_verified'];
            $post['share']['is_spoiler'] = $s_spoiler;
            
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
    return $formatted;
}

// --------------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    // Auto-detect 'create' for legacy compatibility
    if (empty($action) && isset($_POST['caption'])) {
        $action = 'create';
    }

    switch ($action) {
        case 'create':
            $caption = $_POST['caption'];
            $public = 2; // Default
            if (isset($_POST['private'])) {
                 if ($_POST['private'] == "0") $public = 0;
                 elseif ($_POST['private'] == "1") $public = 1;
            }
            $fileData = isset($_FILES['fileUpload']) ? $_FILES['fileUpload'] : null;
            $group_id = isset($_POST['group_id']) ? (int)$_POST['group_id'] : 0;
            $is_spoiler = isset($_POST['is_spoiler']) ? (int)$_POST['is_spoiler'] : 0;
            
            // Safety: Users under 18 cannot upload/mark content as spoiler (NSFW)
            if ($viewer_age < 18) {
                $is_spoiler = 0;
            }

            $response = Post::create($user_id, $caption, $public, $fileData, $group_id, $is_spoiler);
            echo json_encode($response);
            break;
            
        case 'delete':
            $postId = isset($_POST['post_id']) ? $_POST['post_id'] : '';
            if ($postId) {
                echo json_encode(Post::delete($postId, $user_id));
            } else {
                echo json_encode(["success" => 0, "err" => "Missing ID"]);
            }
            break;
            
        case 'update':
            $postId = isset($_POST['post_id']) ? $_POST['post_id'] : '';
            $caption = isset($_POST['caption']) ? $_POST['caption'] : '';
            $public = isset($_POST['private']) ? $_POST['private'] : 2;
            if ($postId) {
                echo json_encode(Post::update($postId, $user_id, $caption, $public));
            } else {
                 echo json_encode(["success" => 0, "err" => "Missing ID"]);
            }
            break;
            
        case 'pin':
            $postId = isset($_POST['post_id']) ? $_POST['post_id'] : '';
            if ($postId) {
                echo json_encode(Post::togglePin($postId, $user_id));
            } else {
                echo json_encode(["success" => 0, "err" => "Missing ID"]);
            }
            break;
            
        case 'like':
             $id = isset($_POST['post_id']) ? $_POST['post_id'] : 0;
             if (is_numeric($id) && is_post_exists($id)) {
                 global $db_post;
                 $query = $conn->query("SELECT * FROM $db_post.likes WHERE user_id = $user_id AND post_id = $id");
                 if($query->num_rows > 0){
                     $conn->query("DELETE FROM $db_post.likes WHERE user_id = $user_id AND post_id = $id");
                     echo "0;".total_like($id);
                 } else {
                     $conn->query("INSERT INTO $db_post.likes (user_id, post_id) VALUES ($user_id, $id)");
                     
                     // Notification
                     require_once '../includes/classes/Notification.php';
                     $notif = new Notification();
                     $postOwnerQuery = $conn->query("SELECT post_by FROM $db_post.posts WHERE post_id = $id");
                     if ($postOwnerQuery && $postOwnerQuery->num_rows > 0) {
                         $postOwnerId = $postOwnerQuery->fetch_assoc()['post_by'];
                         $notif->create($postOwnerId, $user_id, 'like', $id);
                     }
                     echo "1;".total_like($id);
                 }
             } else {
                 echo "Error";
             }
             break;
             
        case 'share':
            $postId = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
            $caption = isset($_POST['caption']) ? $_POST['caption'] : '';
            $public = 2; // Default
            if (isset($_POST['private'])) {
                 if ($_POST['private'] == "0") $public = 0;
                 elseif ($_POST['private'] == "1") $public = 1;
            }
            $fileData = isset($_FILES['fileUpload']) ? $_FILES['fileUpload'] : null;
            $groupId = isset($_POST['group_id']) ? intval($_POST['group_id']) : 0;
            
            if ($postId > 0) {
                $response = Post::share($user_id, $postId, $caption, $public, $fileData, $groupId);
                echo json_encode($response);
            } else {
                 echo json_encode(['success' => 0, 'message' => 'Missing ID']);
            }
            break;

        case 'comment':
            $id = isset($_POST['post_id']) ? $_POST['post_id'] : 0;
            $comment = isset($_POST['comment']) ? $_POST['comment'] : '';
            
            if (is_numeric($id) && !empty($comment)) {
                if(!is_post_exists($id)) die('{"success":-1}');
                $postinfo = getInfoPostID($id);
                if($postinfo['allow_comment'] == 0) die('{"success":-1}');
                
                $cf = $GLOBALS['commandfunc'];
                $cf->setUserData($data);
                if($cf->allowUseCommand()){
                    $isCommand = $cf->parse_command($comment);
                    if(is_array($isCommand)){
                        switch(strtolower($isCommand[0])){
                            case 'verify':
                                $c = $cf->execute($isCommand[0],$isCommand[1],$postinfo['post_by']);
                                break;
                            case 'allow_comment':
                                $c = $cf->execute($isCommand[0],$isCommand[1],$id);
                                break;
                        }
                        die('{"success":1,"c":'.($c ? 1 : 0).'}');
                    }
                }
                
                global $db_post;
                $sql = "INSERT INTO `$db_post`.`comments` (`post_id`, `user_id`, `comment`, `comment_time`) VALUES ('$id', '$user_id', '" . $conn->real_escape_string($comment) . "', '$timestamp')";
                $query = $conn->query($sql);
                if($query){
                    require_once '../includes/classes/Notification.php';
                    $notif = new Notification();
                    $notif->create($postinfo['post_by'], $user_id, 'comment', $id);
                    echo '{"success":1}';
                }
            } else {
                echo '{"success":0}';
            }
            break;
            
        default:
            echo json_encode(['success' => 0, 'message' => 'Invalid action']);
            break;
    }

} else {
    // GET Handler
    $scope = isset($_GET['scope']) ? $_GET['scope'] : 'feed';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 0;
    
    switch ($scope) {
        case 'feed':
            $feed = Post::getFeed($user_id, $page);
            echo json_encode(formatPosts($feed, $user_id, $viewer_age));
            break;
            
        case 'profile':
            $target_id = isset($_GET['id']) ? $_GET['id'] : $user_id;
            if (!is_numeric($target_id)) $target_id = $user_id;
            if (!User::exists($target_id)) $target_id = $user_id;
            
            $feed = Post::getProfilePosts($target_id, $user_id, $page);
            echo json_encode(formatPosts($feed, $user_id, $viewer_age));
            break;
            
        case 'liked':
            $target_id = isset($_GET['id']) ? $_GET['id'] : $user_id;
            if (!is_numeric($target_id)) $target_id = $user_id;
            
            $feed = Post::getLikedPosts($target_id, $page);
            echo json_encode(formatPosts($feed, $user_id, $viewer_age));
            break;
            
        case 'group':
             $group_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
             
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
             
             if ($group_info['group_privacy'] < 2) {
                 if (!$group->isMember($group_id, $user_id)) {
                     echo json_encode(['success' => 0, 'message' => 'Access denied.']);
                     exit;
                 }
             }
             
             $feed = Post::getGroupPosts($group_id, $user_id, $page);
             
             $formatted = formatPosts($feed, $user_id, $viewer_age);
             if (isset($formatted[0])) {
                 // Add group-specific permissions to each post
                 $count = count($formatted) - 1; // -1 for success key
                 for ($i = 0; $i < $count; $i++) {
                     $formatted[$i]['can_pin'] = ($group_info['my_role'] >= 2) ? 1 : 0;
                     $formatted[$i]['can_delete'] = ($formatted[$i]['is_mine'] == 1 || $group_info['my_role'] >= 2) ? 1 : 0;
                 }
             }
             
             echo json_encode($formatted);
             break;
             
        case 'single':
            $id = isset($_GET['id']) ? $_GET['id'] : 0;
            if (is_numeric($id)) {
                $post = Post::getPost($id, $user_id);
                if ($post) {
                    $post['success'] = 1;
                    echo json_encode($post);
                } else {
                    echo json_encode(['success' => 0]);
                }
            }
            break;
            
        case 'comments':
            $id = isset($_GET['id']) ? $_GET['id'] : 0;
            $comments = Comment::getComments($id, $page);
            if (empty($comments)) {
                echo '{"success":2}';
            } else {
                 $formatted = $comments;
                 $formatted["success"] = 1;
                 echo json_encode($formatted);
            }
            break;
            
        case 'trending':
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
            $trending = Post::getTrending($limit);
            echo json_encode(['success' => 1, 'data' => $trending]);
            break;
            
        case 'media':
             $id = isset($_GET['id']) ? $_GET['id'] : 0;
             if(is_numeric($id) && is_post_exists($id)){
                 $media = Post::getMedia($id);
                 $formatted = ['success' => 1, 'media' => $media];
                 echo json_encode($formatted);
             } else {
                 echo json_encode(['success' => 0]);
             }
             break;
             
        default:
             echo json_encode(['success' => 0, 'message' => 'Invalid scope']);
             break;
    }
}
?>
