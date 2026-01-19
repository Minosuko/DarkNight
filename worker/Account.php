<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Group.php';

if (!_is_session_valid()) {
    header("content-type: application/json");
    echo json_encode(['success' => -1]);
    exit();
}

$data = _get_data_from_token();
header("content-type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';
$type = $_REQUEST['type'] ?? '';

if ($method === 'POST') {
    // --- Unified Update Action (from change_account_infomation.php) ---
    // Mapping legacy 'type' to actions if action is not set
    if (empty($action) && !empty($type)) {
        switch ($type) {
            case 'ChangePassword': $action = 'update_password'; break;
            case 'ChangeUsername': $action = 'update_username'; break;
            case 'ChangeEmail': $action = 'update_email'; break;
            case 'RequestEmailCode': $action = 'request_email_code'; break;
            case 'ChangePofileInfomation': $action = 'update_profile'; break;
            case 'cover': 
            case 'profile':
                $action = 'update_picture'; 
                break;
        }
    }

    if ($action === 'update_password') {
        if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewPassword']) && !isset($_POST['VerifyPassword']) && !isset($_POST['LogAllsDevice']))
            die('{"success":-1}');
        
        $CurrentPassword = decryptPassword($_POST['CurrentPassword']);
        $NewPassword = decryptPassword($_POST['NewPassword']);
        $VerifyPassword = decryptPassword($_POST['VerifyPassword']);
        $LogAllsDevice = $_POST['LogAllsDevice'];
        
        if($NewPassword != $VerifyPassword) die('{"success":0,"code":0}');
        if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
        
        $hashPassword = password_hash($NewPassword, PASSWORD_DEFAULT);
        global $db_user;
        $sql = sprintf("UPDATE $db_user.users SET user_password = '%s' WHERE user_id = %d", $conn->real_escape_string($hashPassword), $data['user_id']);
        
        if($LogAllsDevice == 1){
            $esql = sprintf("DELETE FROM $db_user.session WHERE user_id = %d AND session_id != '%s'", $data['user_id'], $conn->real_escape_string($_COOKIE['session_id']));
            $conn->query($esql);
        }
        $conn->query($sql);
        
        // Email Notification
        $name = "{$data['user_firstname']} {$data['user_lastname']}";
        $MailBody = $GLOBALS['Mailer_Header'] . '
            <p>Hello '.$name.',</p>
            <p>Seem like you changed your password</p>
            <br><br>
            <p>If you didn’t change your password, reply via this email for support.</p>
            <br>
            <center><b>- DarkNightDev - </b></center>'
        . $GLOBALS['Mailer_Footer'];
        
        $Mailer->send($data['user_email'], "DarkNight - Password changed", $MailBody, ['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]);
        
        echo '{"success":1}';
        exit;
    }

    if ($action === 'update_username') {
        if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewUsername'])) die('{"success":-1}');
        
        $CurrentPassword = decryptPassword($_POST['CurrentPassword']);
        $NewUsername = $_POST['NewUsername'];
        
        if(!_is_username_valid($NewUsername)) die('{"success":0,"code":0}');
        if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
        if(username_exists($NewUsername)) die('{"success":0,"code":2}');
        
        if($data['last_username_change'] != 0)
            if(time() - $data['last_username_change'] < (86400*90))
                die('{"success":0,"code":3}');
        
        $time = time();
        global $db_user;
        $sql = sprintf("UPDATE $db_user.users SET user_nickname = '%s', last_username_change = %d WHERE user_id = %d", $conn->real_escape_string($NewUsername), $time, $data['user_id']);
        $conn->query($sql);
        
        // Email Notification
        $name = "{$data['user_firstname']} {$data['user_lastname']}";
        $MailBody = $GLOBALS['Mailer_Header'] . '
            <p>Hello '.$name.',</p>
            <p>Seem like you changed your username</p>
            <br><br>
            <p>Your new username is '.$NewUsername.'</p>
            <br>
            <center><b>- DarkNightDev - </b></center>'
        . $GLOBALS['Mailer_Footer'];
        
        $Mailer->send($data['user_email'], "DarkNight - Username changed", $MailBody, ['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]);
        
        echo '{"success":1}';
        exit;
    }

    if ($action === 'update_email') {
        if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewEmail']) && !isset($_POST['VerifyCode'])) die('{"success":-1}');
        
        $CurrentPassword = decryptPassword($_POST['CurrentPassword']);
        $NewEmail = $_POST['NewEmail'];
        $VerifyCode = $_POST['VerifyCode'];
        
        if(!filter_var($NewEmail, FILTER_VALIDATE_EMAIL)) die('{"success":0,"code":0}');
        if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
        if(email_exists($NewEmail)) die('{"success":0,"code":2}');
        
        $timeSlice = floor(time() / 900);
        $code = substr(hash("sha256",lunar_hash(strtolower($NewEmail).$data['user_email'].$data['user_password'].$data['user_create_date'].$timeSlice)),0,8);
        if($VerifyCode != $code) die('{"success":0,"code":3}');
        
        $sql = sprintf("UPDATE $db_user.users SET user_email = '%s' WHERE user_id = %d", $conn->real_escape_string($NewEmail), $data['user_id']);
        $conn->query($sql);
        
        $emailE = explode('@',$NewEmail);
        $name = "{$data['user_firstname']} {$data['user_lastname']}";
        $MailBody = $GLOBALS['Mailer_Header'] . '
            <p>Hello '.$name.',</p>
            <p>Seem like you changed your email addess to '.substr($NewEmail,0,3).'*****@'.$emailE[1].'</p>
            <br><br>
            <p>If you didn’t change your email, reply via this email for support.</p>
            <br>
            <center><b>- DarkNightDev - </b></center>'
        . $GLOBALS['Mailer_Footer'];
        
        $Mailer->send($NewEmail, "DarkNight - Email changed", $MailBody, ['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]);
        
        echo '{"success":1}';
        exit;
    }

    if ($action === 'request_email_code') {
        if(!isset($_POST['CurrentPassword']) && !isset($_POST['NewEmail'])) die('{"success":-1}');
        
        $CurrentPassword = decryptPassword($_POST['CurrentPassword']);
        $NewEmail = $_POST['NewEmail'];
        
        if(!filter_var($NewEmail, FILTER_VALIDATE_EMAIL)) die('{"success":0,"code":0}');
        if(!password_verify($CurrentPassword, $data['user_password'])) die('{"success":0,"code":1}');
        if(email_exists($NewEmail)) die('{"success":0,"code":2}');
        
        $timeSlice = floor(time() / 900);
        $code = substr(hash("sha256",lunar_hash(strtolower($NewEmail).$data['user_email'].$data['user_password'].$data['user_create_date'].$timeSlice)),0,8);
        
        $name = "{$data['user_firstname']} {$data['user_lastname']}";
        $MailBody = $GLOBALS['Mailer_Header'] . '
            <p>Hello '.$name.',</p>
            <p>Seem like you want to change your email addess</p>
            <br>
            <p>Your verification code is <span class="code">'.$code.'</span>, this code valid for few minutes</p>
            <br><br>
            <p>If you didn’t ask to change your email, you can ignore this email.</p>
            <br>
            <center><b>- DarkNightDev - </b></center>'
        . $GLOBALS['Mailer_Footer'];
        
        $Mailer->send($NewEmail, "DarkNight - Change email request", $MailBody, ['isHTML' => true, 'From' => 'DarkNight', 'to' => $name]);
        
        echo '{"success":1}';
        exit;
    }

    if ($action === 'update_profile') {
        if(!isset($_POST['userfirstname']) && !isset($_POST['userlastname']) && !isset($_POST['birthday']) && !isset($_POST['usergender']) && !isset($_POST['userhometown']) && !isset($_POST['userabout']) && !isset($_POST['userstatus']))
            die('{"success":-1}');
            
        $userfirstname = str_replace([' ','	',"\r","\n"],'',trim($_POST['userfirstname']));
        $userlastname = str_replace([' ','	',"\r","\n"],'',trim($_POST['userlastname']));
        $usergender = $_POST['usergender'];
        $userhometown = $_POST['userhometown'];
        $userabout = $_POST['userabout'];
        $userstatus = $_POST['userstatus'];
        $relationship_id = isset($_POST['relationship_user_id']) ? (int)$_POST['relationship_user_id'] : 0;
        
        if(empty($userfirstname)) die('{"success":0,"code":0}');
        if(empty($userlastname)) die('{"success":0,"code":0}');
        if(strlen($userhometown) > 255) die('{"success":0,"code":1}');
        if(!validateDate($_POST['birthday'])) die('{"success":0,"code":2}');
        
        $userbirthdate = strtotime($_POST['birthday']);
        $usergender = in_array($usergender,["F","M","U"]) ? $usergender : "U";
        $userstatus = in_array($userstatus,["N","S","E","M","L","D","U"]) ? $userstatus : "N";
        
        global $db_user;
        $sql = sprintf(
            "UPDATE $db_user.users SET user_birthdate = %d, user_firstname = '%s', user_lastname = '%s', user_gender = '%s', user_hometown = '%s', user_about = '%s', user_status = '%s', relationship_user_id = %d WHERE user_id = %d",
            $userbirthdate,
            $conn->real_escape_string($userfirstname),
            $conn->real_escape_string($userlastname),
            $usergender,
            $conn->real_escape_string($userhometown),
            $conn->real_escape_string($userabout),
            $userstatus,
            $relationship_id,
            $data['user_id']
        );
        $conn->query($sql);
        echo '{"success":1}';
        exit;
    }

    if ($action === 'update_picture') {
        if(isset($_FILES['fileUpload']) && isset($_POST['type'])){
            $type = $_POST['type']; // cover or profile
            $group_id = isset($_POST['group_id']) ? (int)$_POST['group_id'] : 0;
            
            // Validate type
            if(!in_array($type, ['cover', 'profile'])) die("error: invalid type");

            // Permission Check
            $can_update = false;
            $gInfo = null;
            if ($group_id > 0) {
                $groupObj = new Group($conn);
                $gInfo = $groupObj->getInfo($group_id, $data['user_id']);
                if ($gInfo && $gInfo['my_role'] >= 1) { // 1 = Moderator, 2 = Admin
                    $can_update = true;
                }
            } else {
                $can_update = true; // Own profile
            }

            if (!$can_update) {
                echo "error: permission denied";
                exit;
            }

            $filename = basename($_FILES["fileUpload"]["name"]);
            $filetype = pathinfo($filename, PATHINFO_EXTENSION);
            $supported_image = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];
            
            if(in_array($filetype, $supported_image)){
                if(exif_imagetype($_FILES["fileUpload"]["tmp_name"])){
                    $media_hash = md5_file($_FILES["fileUpload"]["tmp_name"]);
                    $filepath = __DIR__ . "/../data/images/image/$media_hash.bin";
                    $media_format = mime_content_type($_FILES["fileUpload"]["tmp_name"]);
                    
                    global $db_media;
                    $sql6 = "SELECT * FROM $db_media.media WHERE media_hash = '$media_hash'";
                    $query6 = $conn->query($sql6);
                    if($query6->num_rows == 0){
                        $sql6 = "INSERT INTO $db_media.media (media_format, media_hash, media_ext) VALUES ('$media_format','$media_hash', '$filetype')";
                        $query6 = $conn->query($sql6);
                        $media_id = $conn->insert_id;
                    } else {
                        $media_id = $query6->fetch_assoc()["media_id"];
                    }
                    
                    if(move_uploaded_file($_FILES["fileUpload"]["tmp_name"], $filepath)){
                        $field = ($type == 'profile') ? 'pfp_media_id' : 'cover_media_id';
                        $timestamp = time();

                        if ($group_id > 0) {
                            global $db_post, $db_user;
                            $caption = ($type == 'profile') ? "updated the community picture." : "updated the community cover.";
                            $sql5 = sprintf("INSERT INTO $db_post.posts (post_caption, post_public, post_time, post_by, post_media, group_id) VALUES ('%s %s', 2, $timestamp, {$data['user_id']}, $media_id, $group_id)",
                                $conn->real_escape_string($gInfo['group_name']), $caption
                            );
                            $conn->query($sql5);
                            $conn->query("UPDATE $db_post.groups SET $field = $media_id WHERE group_id = $group_id");
                        } else {
                            global $db_post, $db_user;
                            $caption = ($type == 'profile') ? "has changed profile picture." : "has changed cover picture.";
                            $sql5 = sprintf("INSERT INTO $db_post.posts (post_caption, post_public, post_time, post_by, post_media) VALUES ('%s %s', 2, $timestamp, {$data['user_id']}, $media_id)",
                                $conn->real_escape_string("{$data['user_firstname']} {$data['user_lastname']}"), $caption
                            );
                            $conn->query($sql5);
                            $conn->query("UPDATE $db_user.users SET $field = $media_id WHERE user_id = {$data['user_id']}");
                        }
                    }
                }
            }
            echo "success"; // Legacy response expected strict 'success'
            exit;
        }
    }

    // --- Validation Actions ---
    if ($action === 'check_email') {
        if(!isset($_POST['email'])) die('{"success":-1}');
        $email = $_POST['email'];
        echo('{"success":1,"code":'.(filter_var($email, FILTER_VALIDATE_EMAIL) ? (email_exists($email) ? 1 : 0) : 2).'}');
        exit;
    }

    if ($action === 'check_username') {
        if(!isset($_POST['username'])) die('{"success":-1}');
        $username = $_POST['username'];
        echo('{"success":1,"code":'.(_is_username_valid($username) ? (username_exists($username) ? 1 : 0) : 2).'}');
        exit;
    }
}

// Handle GET requests
if ($method === 'GET') {
    if ($action === 'profile_images') {
        $row_d = [];
        $row_d['user_gender'] = $data['user_gender'];
        $row_d['pfp_media_id'] = $data['pfp_media_id'];
        $row_d['cover_media_id'] = $data['cover_media_id'];
        $row_d['pfp_media_hash'] = ($data['pfp_media_id'] > 0) ? _get_hash_from_media_id($data['pfp_media_id']) : null;
        $row_d['cover_media_hash'] = ($data['cover_media_id'] > 0) ? _get_hash_from_media_id($data['cover_media_id']) : null;
        $row_d["success"] = 1;
        echo json_encode($row_d);
        exit;
    }
}
?>
