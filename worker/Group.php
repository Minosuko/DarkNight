<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Group.php';
require_once '../includes/classes/Notification.php'; // Required for invites/requests if migrated logic uses it

if (!_is_session_valid()) {
    header("content-type: application/json");
    echo json_encode(['success' => 0, 'message' => 'Invalid session']);
    exit();
}

$data = _get_data_from_token();
$user_id = $data['user_id'];
header("content-type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';

// --- POST Actions ---
if ($method === 'POST') {
    
    switch ($action) {
        case 'create':
            $group_name = isset($_POST['name']) ? trim($_POST['name']) : '';
            $group_about = isset($_POST['about']) ? trim($_POST['about']) : '';
            $group_privacy = isset($_POST['privacy']) ? (int)$_POST['privacy'] : 2;

            if (empty($group_name)) {
                echo json_encode(['success' => 0, 'message' => 'Group name is required']);
                exit;
            }

            $group = new Group($conn);
            $group_id = $group->create($group_name, $group_about, $group_privacy, $user_id);

            if ($group_id) {
                echo json_encode(['success' => 1, 'group_id' => $group_id, 'message' => 'Group created successfully']);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Failed to create group']);
            }
            break;

        case 'update':
            $group_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
            $group_name = isset($_POST['name']) ? trim($_POST['name']) : '';
            $group_about = isset($_POST['about']) ? trim($_POST['about']) : '';
            $group_rules = isset($_POST['rules']) ? trim($_POST['rules']) : '';
            $group_privacy = isset($_POST['privacy']) ? (int)$_POST['privacy'] : 2;

            if ($group_id <= 0) {
                echo json_encode(['success' => 0, 'message' => 'Invalid group ID']);
                exit;
            }

            if (empty($group_name)) {
                echo json_encode(['success' => 0, 'message' => 'Group name is required']);
                exit;
            }

            $group = new Group($conn);
            $info = $group->getInfo($group_id, $user_id);
            if (!$info || $info['my_role'] < 2) { // 2 = Admin
                echo json_encode(['success' => 0, 'message' => 'You do not have permission to edit this group']);
                exit;
            }

            if ($group->update($group_id, $group_name, $group_about, $group_privacy, $group_rules)) {
                echo json_encode(['success' => 1, 'message' => 'Group updated successfully']);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Failed to update group']);
            }
            break;

        case 'delete':
            if (!isset($_POST['id']) || !isset($_POST['password'])) {
                echo json_encode(['success' => 0, 'err' => 'missing_params']);
                exit;
            }

            $groupId = intval($_POST['id']);
            $password = decryptPassword($_POST['password']);
            
            // Password Verification
            if (!password_verify($password, $data['user_password'])) {
                echo json_encode(['success' => 0, 'err' => 'invalid_password']);
                exit;
            }

            // 2FA Verification
            if (Has2FA($data['user_id'])) {
                if (!isset($_POST['code'])) {
                    echo json_encode(['success' => 0, 'err' => '2fa_required']);
                    exit;
                }
                $code = $_POST['code'];
                if (!_verify_2FA($code, $data['user_id'])) {
                    echo json_encode(['success' => 0, 'err' => 'invalid_2fa']);
                    exit;
                }
            }

            $group = new Group($conn);
            $gInfo = $group->getInfo($groupId, $user_id);
            
            if (!$gInfo) {
                echo json_encode(['success' => 0, 'err' => 'group_not_found']);
                exit;
            }
            
            if ($gInfo['my_role'] < 2) {
                echo json_encode(['success' => 0, 'err' => 'unauthorized']);
                exit;
            }

            if ($group->delete($groupId, $user_id)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0, 'err' => 'db_error']);
            }
            break;

        case 'join':
        case 'leave':
            $group_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
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

            if ($action === 'join') {
                if ($group_info['my_status'] == 1) {
                    echo json_encode(['success' => 0, 'message' => 'You are already a member']);
                    exit;
                }
                $status = ($group_info['group_privacy'] == 2) ? 1 : 0;
                if ($group->addMember($group_id, $user_id, 0, $status)) {
                    echo json_encode(['success' => 1, 'status' => $status, 'message' => $status == 1 ? 'Joined successfully' : 'Request sent']);
                } else {
                    echo json_encode(['success' => 0, 'message' => 'Failed to process request']);
                }
            } else { // leave
                if ($group_info['my_status'] != 1) {
                    echo json_encode(['success' => 0, 'message' => 'You are not a member']);
                    exit;
                }
                
                // Use model method ideally, but raw SQL was used in legacy.
                // Assuming Group class has removeMember, but legacy code ran DELETE directly.
                // Let's use removeMember if available or stick to SQL for consistency.
                // Looking at Group.php interface inferred from admin action: removeMember($group_id, $user_id) exists.
                if ($group->removeMember($group_id, $user_id)) {
                    echo json_encode(['success' => 1, 'message' => 'Left successfully']);
                } else {
                    echo json_encode(['success' => 0, 'message' => 'Failed to leave group']);
                }
            }
            break;

        case 'kick':
        case 'promote':
        case 'demote':
            if (!isset($_POST['group_id']) || !isset($_POST['target_user_id'])) {
                echo json_encode(['success' => 0, 'message' => 'Missing parameters']);
                exit;
            }
            
            $group_id = intval($_POST['group_id']);
            $target_user_id = intval($_POST['target_user_id']);
            
            $group = new Group($conn);
            $group_info = $group->getInfo($group_id, $user_id);
            
            if (!$group_info) {
                echo json_encode(['success' => 0, 'message' => 'Group not found']);
                exit;
            }
            
            $my_role = $group_info['my_role']; // 0: Member, 1: Mod, 2: Admin
            
            if ($my_role < 1) {
                echo json_encode(['success' => 0, 'message' => 'Permission denied']);
                exit;
            }
            
            // Get target role
            // We need to implement getMemberRole or query manual. Ref legacy: manual query.
            global $db_post;
            $target_sql = "SELECT role FROM $db_post.group_members WHERE group_id = $group_id AND user_id = $target_user_id AND status = 1";
            $query = $conn->query($target_sql);
            if ($query->num_rows == 0) {
                echo json_encode(['success' => 0, 'message' => 'Target user is not a member']);
                exit;
            }
            $target_role = $query->fetch_assoc()['role'];

            if ($action === 'kick') {
                if ($my_role == 2 || ($my_role == 1 && $target_role == 0)) {
                    if ($group->removeMember($group_id, $target_user_id)) {
                        echo json_encode(['success' => 1, 'message' => 'Member kicked successfully']);
                    } else {
                        echo json_encode(['success' => 0, 'message' => 'Failed to kick member']);
                    }
                } else {
                    echo json_encode(['success' => 0, 'message' => 'Insufficient permissions']);
                }
            } elseif ($action === 'promote') {
                if ($my_role == 2) {
                    if ($target_role == 0) {
                        if ($group->updateMemberRole($group_id, $target_user_id, 1)) {
                            echo json_encode(['success' => 1, 'message' => 'Prromoted to Moderator']);
                        } else {
                            echo json_encode(['success' => 0, 'message' => 'Failed to promote']);
                        }
                    } else {
                        echo json_encode(['success' => 0, 'message' => 'Already Mod/Admin']);
                    }
                } else {
                    echo json_encode(['success' => 0, 'message' => 'Admin only']);
                }
            } elseif ($action === 'demote') {
                if ($my_role == 2) {
                    if ($target_role == 1) {
                        if ($group->updateMemberRole($group_id, $target_user_id, 0)) {
                            echo json_encode(['success' => 1, 'message' => 'Demoted to Member']);
                        } else {
                            echo json_encode(['success' => 0, 'message' => 'Failed to demote']);
                        }
                    } else {
                        echo json_encode(['success' => 0, 'message' => 'Not a Moderator']);
                    }
                } else {
                     echo json_encode(['success' => 0, 'message' => 'Admin only']);
                }
            }
            break;
            
        default:
            echo json_encode(['success' => 0, 'message' => 'Invalid action']);
            break;
    }
}

// --- GET Actions ---
if ($method === 'GET') {
    switch ($action) {
        case 'list':
            global $db_post, $db_user; // Need db_user? No.
            
            // This replaces fetch_groups.php
            // Logic: Fetches discoverable groups + user status
            // Params: query? joined? 
            
            $joined_filter = isset($_GET['joined']) ? (int)$_GET['joined'] : 0;
            
            $sql = "SELECT g.*, 
                    (SELECT COUNT(*) FROM $db_post.group_members WHERE group_id = g.group_id AND status = 1) as member_count,
                    m.status as my_status
                    FROM $db_post.groups g
                    LEFT JOIN $db_post.group_members m ON m.group_id = g.group_id AND m.user_id = $user_id
                    WHERE g.group_privacy >= 1";
            
            if ($joined_filter) {
                 $sql .= " AND m.status = 1";
            }
            
            $sql .= " ORDER BY member_count DESC, created_time DESC";

            $query = $conn->query($sql);
            $groups = [];

            if ($query) {
                while ($row = $query->fetch_assoc()) {
                    if ($row['pfp_media_id'] > 0) {
                        $row['pfp_media_hash'] = _get_hash_from_media_id($row['pfp_media_id']);
                    }
                    if ($row['cover_media_id'] > 0) {
                        $row['cover_media_hash'] = _get_hash_from_media_id($row['cover_media_id']);
                    }
                    $groups[] = $row;
                }
            }
            echo json_encode($groups);
            break;
            
        case 'info':
            $group_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($group_id <= 0) {
                echo json_encode(['success' => 0, 'message' => 'Invalid group ID']);
                exit;
            }
            
            $group = new Group($conn);
            $info = $group->getInfo($group_id, $user_id);
            
            if ($info) {
                if ($info['pfp_media_id'] > 0) $info['pfp_media_hash'] = _get_hash_from_media_id($info['pfp_media_id']);
                if ($info['cover_media_id'] > 0) $info['cover_media_hash'] = _get_hash_from_media_id($info['cover_media_id']);
                $info['success'] = 1;
                echo json_encode($info);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Group not found']);
            }
            break;
            
        case 'members':
            $group_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($group_id <= 0) {
                echo json_encode([]);
                exit;
            }
            
            $group = new Group($conn);
            $group_info = $group->getInfo($group_id, $user_id);
            
            if (!$group_info || ($group_info['group_privacy'] == 0 && $group_info['my_status'] != 1)) {
                echo json_encode([]);
                exit;
            }

            $query_term = isset($_GET['query']) ? $conn->real_escape_string($_GET['query']) : '';
            $searchCond = "";
            if ($query_term !== '') {
                $searchCond = " AND (u.user_firstname LIKE '%$query_term%' OR u.user_lastname LIKE '%$query_term%' OR u.user_nickname LIKE '%$query_term%')";
            }

            global $db_post, $db_user;
            $sql = "SELECT m.user_id, m.role, m.status, m.joined_time, 
                           u.user_firstname, u.user_lastname, u.user_nickname, u.pfp_media_id, u.verified
                    FROM $db_post.group_members m
                    JOIN $db_user.users u ON m.user_id = u.user_id
                    WHERE m.group_id = $group_id AND m.status = 1 $searchCond
                    ORDER BY m.role DESC, m.joined_time ASC";

            $query = $conn->query($sql);
            $members = [];
            if ($query) {
                while ($row = $query->fetch_assoc()) {
                    if ($row['pfp_media_id'] > 0) $row['pfp_media_hash'] = _get_hash_from_media_id($row['pfp_media_id']);
                    $members[] = $row;
                }
            }
            echo json_encode($members);
            break;
            
        case 'photos':
             if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
                echo '{"success":0, "error": "Invalid group ID"}';
                exit();
            }

            $group_id = $_GET['id'];
            $page = isset($_GET['page']) && is_numeric($_GET['page']) ? $_GET['page'] : 0;

            $media = Post::getGroupMedia($group_id, $user_id, $page);

            if (empty($media)) {
                echo '{"success":' . (($page > 0) ? '3' : 2) . '}';
            } else {
                $formatted = [];
                $i = 0;
                foreach ($media as $row) {
                    $item = [
                        'post_id' => $row['post_id'],
                        'media_id' => $row['media_id'],
                        'media_hash' => $row['media_hash'],
                        'media_format' => $row['media_format'],
                        'is_video' => (substr($row['media_format'], 0, 5) == 'video'),
                        'is_spoiler' => intval($row['is_spoiler']),
                        'media_count' => isset($row['media_count']) ? intval($row['media_count']) : 1
                    ];
                    $formatted[$i] = $item;
                    $i++;
                }
                $formatted["success"] = 1;
                echo json_encode($formatted);
            }
            break;
            
        default:
            echo json_encode(['success' => 0, 'message' => 'Invalid action']);
            break;
    }
}
?>
