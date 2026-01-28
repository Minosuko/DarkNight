<?php
require_once '../includes/functions.php';
require_once '../includes/classes/Report.php';

if (!_is_session_valid()) {
    header("content-type: application/json");
    echo json_encode(['success' => 0, 'message' => 'Invalid session']);
    exit();
}

$data = _get_data_from_token();
if (intval($data['verified']) < 20) {
    header("content-type: application/json");
    echo json_encode(['success' => 0, 'message' => 'Permission denied']);
    exit();
}

$user_id = $data['user_id'];
header("content-type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';

if ($method === 'GET') {
    switch ($action) {
        case 'stats':
            // Server Stats
            if (session_status() === PHP_SESSION_NONE) session_start();
            $cache_key = 'admin_static_stats';
            $now = time();
            
            if (!isset($_SESSION[$cache_key]) || ($now - $_SESSION[$cache_key]['timestamp'] > 86400)) {
                $static = [];
                $static['disk_total'] = disk_total_space("/");
                $static['php_version'] = PHP_VERSION;
                $static['darknight_version'] = '2.5.0';
                $static['mysql_version'] = $conn->server_info;
                $static['os'] = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'Windows' : 'Linux';

                if ($static['os'] === 'Windows') {
                    // RAM Total
                    $totalMem = shell_exec('wmic OS get TotalVisibleMemorySize /Value');
                    if ($totalMem && preg_match('/TotalVisibleMemorySize=(\d+)/', $totalMem, $matches)) {
                         $static['ram_total'] = intval($matches[1]) * 1024;
                    }
                    // CPU Model
                    $cpuName = shell_exec('wmic cpu get name /Value');
                    if ($cpuName && preg_match('/Name=(.*)/', $cpuName, $matches)) {
                        $static['cpu_model'] = trim($matches[1]);
                    }
                } else {
                    // RAM Total (Linux)
                    $free = shell_exec('free -b');
                    if ($free) {
                        $lines = explode("\n", trim($free));
                        $mem = preg_split('/\s+/', $lines[1]);
                        $static['ram_total'] = intval($mem[1]);
                    }
                    // CPU Model (Linux)
                    $cpuInfo = shell_exec('cat /proc/cpuinfo | grep "model name" | uniq');
                    if ($cpuInfo) {
                        $static['cpu_model'] = trim(str_replace('model name	: ', '', $cpuInfo));
                    }
                }
                
                $static['timestamp'] = $now;
                $_SESSION[$cache_key] = $static;
            }

            $static = $_SESSION[$cache_key];
            $stats = $static;
            
            // --- Real-time Stats ---
            
            // Disk Real-time
            $stats['disk_free'] = disk_free_space("/");
            $stats['disk_used'] = $stats['disk_total'] - $stats['disk_free'];
            $stats['disk_percent'] = round(($stats['disk_used'] / $stats['disk_total']) * 100, 2);

            // RAM & CPU Real-time
            if ($stats['os'] === 'Windows') {
                // RAM usage
                $freeMem = shell_exec('wmic OS get FreePhysicalMemory /Value');
                if ($freeMem && preg_match('/FreePhysicalMemory=(\d+)/', $freeMem, $matches)) {
                    $free = intval($matches[1]) * 1024;
                    $stats['ram_used'] = $stats['ram_total'] - $free;
                    $stats['ram_usage_percent'] = round(($stats['ram_used'] / $stats['ram_total']) * 100, 2);
                }

                // CPU Load
                $cpuLoad = shell_exec('wmic cpu get loadpercentage /Value');
                if ($cpuLoad && preg_match('/LoadPercentage=(\d+)/', $cpuLoad, $matches)) {
                    $stats['server_load'] = $matches[1] . '%';
                }
            } else {
                // Linux Real-time
                $stats['server_load'] = function_exists('sys_getloadavg') ? sys_getloadavg()[0] . '%' : 'N/A';
                $free = shell_exec('free -b');
                if ($free) {
                    $lines = explode("\n", trim($free));
                    $mem = preg_split('/\s+/', $lines[1]);
                    $stats['ram_used'] = intval($mem[2]);
                    $stats['ram_usage_percent'] = round(($stats['ram_used'] / $stats['ram_total']) * 100, 2);
                }
            }

            // Total Counts (Always fresh as requested to reduce load but keep relevant? 
            // Actually user asked to cache total users/groups too?
            // "update cache CPU Model, PHP Version, MySQL Version, total RAM, total disk"
            // They didn't explicitly mention Users/Groups/Posts/Comments. 
            // Let's keep those live for now, or cache for 5-10 mins.
            // But let's follow the request exactly first.
            
            $db_user = $GLOBALS['db_user'];
            $db_post = $GLOBALS['db_post'];

            $res_u = $conn->query("SELECT COUNT(*) FROM $db_user.users");
            $stats['total_users'] = $res_u ? intval($res_u->fetch_row()[0]) : 0;

            $res_g = $conn->query("SELECT COUNT(*) FROM $db_post.groups");
            $stats['total_groups'] = $res_g ? intval($res_g->fetch_row()[0]) : 0;

            $res_p = $conn->query("SELECT COUNT(*) FROM $db_post.posts");
            $stats['total_posts'] = $res_p ? intval($res_p->fetch_row()[0]) : 0;
            
            $res_c = $conn->query("SELECT COUNT(*) FROM $db_post.comments");
            $stats['total_comments'] = $res_c ? intval($res_c->fetch_row()[0]) : 0;

            echo json_encode(['success' => 1, 'stats' => $stats]);
            break;

        case 'reports':
            $page = intval($_GET['page'] ?? 0);
            $status = intval($_GET['status'] ?? 0);
            $reports = Report::getList($page, $status);
            $total = Report::getCount($status);
            echo json_encode([
                'success' => 1, 
                'reports' => $reports,
                'total' => $total,
                'pending_count' => Report::getCount(0),
                'resolved_count' => Report::getCount(1),
                'ignored_count' => Report::getCount(2)
            ]);
            break;

        case 'search_users':
            $db_user = $GLOBALS['db_user'];
            $db_management = $GLOBALS['db_management'];
            $query = $conn->real_escape_string($_GET['query'] ?? '');
            $where = !empty($query) ? "WHERE user_nickname LIKE '%$query%' OR user_firstname LIKE '%$query%' OR user_lastname LIKE '%$query%'" : "";
            $sql = "SELECT user_id, user_nickname, user_firstname, user_lastname, user_gender, pfp_media_id, verified, is_banned FROM $db_user.users $where ORDER BY user_id DESC LIMIT 20";
            $result = $conn->query($sql);
            $users = [];
            if ($result) {
                while($u = $result->fetch_assoc()) {
                    $u['pfp_media_hash'] = ($u['pfp_media_id'] > 0) ? _get_hash_from_media_id($u['pfp_media_id']) : null;
                    $users[] = $u;
                }
            }
            echo json_encode(['success' => 1, 'users' => $users]);
            break;

        case 'search_groups':
            $db_post = $GLOBALS['db_post'];
            $query = $conn->real_escape_string($_GET['query'] ?? '');
            $where = !empty($query) ? "WHERE group_name LIKE '%$query%'" : "";
            
            $sql = "SELECT group_id, group_name, pfp_media_id, verified, is_banned,
                    (SELECT COUNT(*) FROM $db_post.group_members WHERE group_id = $db_post.groups.group_id AND status = 1) as member_count
                    FROM $db_post.groups $where ORDER BY group_id DESC LIMIT 20";
            
            $result = $conn->query($sql);
            $groups = [];
            if ($result) {
                while($g = $result->fetch_assoc()) {
                    $g['pfp_media_hash'] = ($g['pfp_media_id'] > 0) ? _get_hash_from_media_id($g['pfp_media_id']) : null;
                    $groups[] = $g;
                }
            }
            echo json_encode(['success' => 1, 'groups' => $groups]);
            break;

        case 'get_group_info':
            $db_post = $GLOBALS['db_post'];
            $group_id = intval($_GET['id'] ?? 0);
            
            require_once '../includes/classes/Group.php';
            $groupObj = new Group($conn);
            $info = $groupObj->getInfo($group_id);
            
            if ($info) {
                // Get Creator Name
                $creator_id = $info['created_by'];
                $db_user = $GLOBALS['db_user'];
                $cRes = $conn->query("SELECT user_firstname, user_lastname FROM $db_user.users WHERE user_id = $creator_id");
                $info['creator_name'] = ($cRes && $row = $cRes->fetch_assoc()) ? $row['user_firstname'] . ' ' . $row['user_lastname'] : 'Unknown';

                // Get PFP Hash
                $info['pfp_media_hash'] = ($info['pfp_media_id'] > 0) ? _get_hash_from_media_id($info['pfp_media_id']) : null;
                
                echo json_encode(['success' => 1, 'group' => $info]);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Group not found']);
            }
            break;

        case 'get_report_details':
            $report_id = intval($_GET['id'] ?? 0);
            
            // Use the enhanced getById method
            $report = Report::getById($report_id);
            if ($report) {
                $type = $report['target_type'];
                $tid = $report['target_id'];
                $details = [
                    'report_id' => $report['report_id'],
                    'type' => $type, 
                    'id' => $tid,
                    'reason' => $report['reason'],
                    'status' => $report['status'],
                    'created_time' => $report['created_time'],
                    'reporter' => [
                        'id' => $report['reporter_id'],
                        'name' => $report['reporter_firstname'] . ' ' . $report['reporter_lastname'],
                        'nickname' => $report['reporter_name'],
                        'gender' => $report['reporter_gender'],
                        'pfp_media_id' => $report['reporter_pfp_id'],
                        'pfp_media_hash' => $report['reporter_pfp_hash']
                    ]
                ];

                $db_user = $GLOBALS['db_user'];
                $db_post = $GLOBALS['db_post'];
                $db_media = $GLOBALS['db_media'];

                if ($type === 'user') {
                    $uRes = $conn->query("SELECT u.user_id, u.user_nickname, u.user_firstname, u.user_lastname, u.pfp_media_id, u.is_banned, m.media_hash as pfp_hash
                                          FROM $db_user.users u 
                                          LEFT JOIN $db_media.media m ON u.pfp_media_id = m.media_id
                                          WHERE user_id = $tid");
                    if ($uRes) $details['data'] = $uRes->fetch_assoc();
                } else if ($type === 'group') {
                    $gRes = $conn->query("SELECT g.group_id, g.group_name, g.group_about, g.pfp_media_id, g.is_banned, m.media_hash as pfp_hash
                                          FROM $db_post.groups g
                                          LEFT JOIN $db_media.media m ON g.pfp_media_id = m.media_id
                                          WHERE group_id = $tid");
                    if ($gRes) $details['data'] = $gRes->fetch_assoc();
                } else if ($type === 'post') {
                    $pRes = $conn->query("SELECT p.post_id, p.post_caption, p.post_time, p.post_by, u.user_nickname, u.user_firstname, u.user_lastname
                                        FROM $db_post.posts p 
                                        JOIN $db_user.users u ON p.post_by = u.user_id 
                                        WHERE p.post_id = $tid");
                    if ($pRes) $details['data'] = $pRes->fetch_assoc();
                } else if ($type === 'comment') {
                    $cRes = $conn->query("SELECT c.comment_id, c.comment, c.comment_time, c.post_id, u.user_nickname, u.user_firstname, u.user_lastname
                                        FROM $db_post.comments c 
                                        JOIN $db_user.users u ON c.user_id = u.user_id 
                                        WHERE c.comment_id = $tid");
                    if ($cRes) $details['data'] = $cRes->fetch_assoc();
                }

                echo json_encode(['success' => 1, 'details' => $details]);
            } else {
                echo json_encode(['success' => 0, 'message' => 'Report not found']);
            }
            break;

        default:
            echo json_encode(['success' => 0, 'message' => 'Invalid action']);
            break;
    }
}

if ($method === 'POST') {
    switch ($action) {
        case 'ban_user':
            $target_id = intval($_POST['target_id'] ?? 0);
            if (User::ban($target_id)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0]);
            }
            break;

        case 'unban_user':
            $target_id = intval($_POST['target_id'] ?? 0);
            if (User::unban($target_id)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0]);
            }
            break;

        case 'ban_group':
            $target_id = intval($_POST['target_id'] ?? 0);
            $group = new Group($conn);
            if ($group->ban($target_id)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0]);
            }
            break;

        case 'unban_group':
            $target_id = intval($_POST['target_id'] ?? 0);
            $group = new Group($conn);
            if ($group->unban($target_id)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0]);
            }
            break;

        case 'verify_user':
            $target_id = intval($_POST['target_id'] ?? 0);
            $level = intval($_POST['level'] ?? 1);
            if (User::updateVerifiedBadge($target_id, $level)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0]);
            }
            break;

        case 'verify_group':
            $target_id = intval($_POST['target_id'] ?? 0);
            $status = intval($_POST['status'] ?? 1);
            $group = new Group($conn);
            if ($group->updateVerification($target_id, $status)) {
                echo json_encode(['success' => 1]);
            } else {
                echo json_encode(['success' => 0]);
            }
            break;

        case 'resolve_report':
            $report_id = intval($_POST['report_id'] ?? 0);
            $status = intval($_POST['status'] ?? 1); // 1: Resolved, 2: Ignored
            
            // Get reporter data before finalizing
            $db_management = $GLOBALS['db_management'];
            $res = $conn->query("SELECT reporter_id, target_type, target_id FROM $db_management.reports WHERE report_id = $report_id");
            if ($res && $rep = $res->fetch_assoc()) {
                if (Report::updateStatus($report_id, $status)) {
                    // Send notification to reporter
                    require_once '../includes/classes/Notification.php';
                    $notif = new Notification();
                    $msg_type = ($status == 1) ? 'report_resolved' : 'report_processed';
                    $notif->create($rep['reporter_id'], 0, $msg_type, $report_id);
                    
                    echo json_encode(['success' => 1]);
                } else {
                    echo json_encode(['success' => 0]);
                }
            } else {
                echo json_encode(['success' => 0, 'message' => 'Report not found']);
            }
            break;

        default:
            echo json_encode(['success' => 0, 'message' => 'Invalid action']);
            break;
    }
}
