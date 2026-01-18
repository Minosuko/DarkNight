<?php
require_once '../includes/functions.php';

if (!_is_session_valid()) {
    header("location:../index.php");
    exit();
}

header("content-type: application/json");
$data = _get_data_from_token();
$user_id = $data['user_id'];

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['group_id']) && isset($_POST['target_user_id']) && isset($_POST['action'])) {
    $group_id = intval($_POST['group_id']);
    $target_user_id = intval($_POST['target_user_id']);
    $action = $_POST['action'];
    
    $group = new Group(Database::getInstance()->getConnection());
    $group_info = $group->getInfo($group_id, $user_id);
    
    if (!$group_info) {
        echo json_encode(['success' => 0, 'message' => 'Group not found']);
        exit();
    }
    
    $my_role = $group_info['my_role']; // 0: Member, 1: Mod, 2: Admin
    
    // Authorization
    if ($my_role < 1) {
        echo json_encode(['success' => 0, 'message' => 'Permission denied']);
        exit();
    }
    
    // Fetch target user's role in the group
    $target_sql = "SELECT role FROM group_members WHERE group_id = $group_id AND user_id = $target_user_id AND status = 1";
    $query = Database::getInstance()->getConnection()->query($target_sql);
    if ($query->num_rows == 0) {
        echo json_encode(['success' => 0, 'message' => 'Target user is not a member of this group']);
        exit();
    }
    $target_role = $query->fetch_assoc()['role'];
    
    if ($action == 'kick') {
        // Admin can kick anyone (except themselves, but we check target_user_id != user_id if needed)
        // Moderator can only kick normal members (role 0)
        if ($my_role == 2 || ($my_role == 1 && $target_role == 0)) {
            if ($group->removeMember($group_id, $target_user_id)) {
                echo json_encode(['success' => 1, 'message' => 'Member kicked successfully']);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Failed to kick member']);
            }
        } else {
            echo json_encode(['success' => 0, 'message' => 'Insufficient permissions to kick this user']);
        }
    } elseif ($action == 'promote') {
        // Only Admin can promote
        if ($my_role == 2) {
            $new_role = ($target_role == 0) ? 1 : 2; // Member -> Mod, Mod -> Admin (danger?)
            // For now, let's limit: Member -> Mod. 
            if ($target_role == 0) {
                if ($group->updateMemberRole($group_id, $target_user_id, 1)) {
                    echo json_encode(['success' => 1, 'message' => 'Member promoted to Moderator']);
                } else {
                    echo json_encode(['success' => 0, 'message' => 'Failed to promote member']);
                }
            } else {
                echo json_encode(['success' => 0, 'message' => 'User is already a Moderator or Admin']);
            }
        } else {
            echo json_encode(['success' => 0, 'message' => 'Only admins can promote members']);
        }
    } elseif ($action == 'demote') {
        // Only Admin can demote
        if ($my_role == 2) {
            if ($target_role == 1) {
                if ($group->updateMemberRole($group_id, $target_user_id, 0)) {
                    echo json_encode(['success' => 1, 'message' => 'Moderator demoted to Member']);
                } else {
                    echo json_encode(['success' => 0, 'message' => 'Failed to demote member']);
                }
            } else {
                echo json_encode(['success' => 0, 'message' => 'User is not a Moderator']);
            }
        } else {
            echo json_encode(['success' => 0, 'message' => 'Only admins can demote moderators']);
        }
    } else {
        echo json_encode(['success' => 0, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => 0, 'message' => 'Invalid request']);
}
