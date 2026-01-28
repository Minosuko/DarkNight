<?php
session_start();
require_once '../../includes/functions.php';

if (!_is_session_valid()) {
    // Check if it's just 2FA pending
    if (_is_session_valid(true, true)) {
        header("Location: ../../verify.php?t=2FA&redirect=" . urlencode($_SERVER['REQUEST_URI']));
        exit();
    }
    header("Location: ../../index.php");
    exit();
}

$data = _get_data_from_token();
if ($data['verified'] < 20) {
    echo "<h1>Access Denied</h1><p>You do not have permission to access the administrative dashboard.</p>";
    exit();
}

// Get PFP Hash for real avatar
$pfp_hash = null;
if ($data['pfp_media_id'] > 0) {
    $pfp_hash = _get_hash_from_media_id($data['pfp_media_id']);
}

$pfp_src = "../../data/blank.jpg";
if ($pfp_hash) {
    $pfp_src = "../../data/images.php?t=profile&id=" . $data['pfp_media_id'] . "&h=" . $pfp_hash;
} else {
    // Default PFPs
    $t = 'U';
    if ($data['user_gender'] == 'M') $t = 'M';
    if ($data['user_gender'] == 'F') $t = 'F';
    $pfp_src = "../../data/images.php?t=default_" . $t;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Darknight - Admin Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Main CSS -->
    <link rel="stylesheet" type="text/css" href="../../resources/css/main.css">
    <link rel="stylesheet" type="text/css" href="../../resources/css/font-awesome/all.css">
    <!-- Dashboard Specific CSS -->
    <link rel="stylesheet" type="text/css" href="../../resources/css/dashboard.css">
    <!-- Google Fonts for Premium Feel -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <div class="dashboard-wrapper">
        <!-- Sidebar Navigation -->
        <aside class="dashboard-sidebar">
            <div class="sidebar-brand">
                <i class="fa-solid fa-ghost"></i>
                <span>DN Admin</span>
            </div>
            
            <nav>
                <ul class="sidebar-nav">
                    <li>
                        <a href="#overview" class="nav-item active" data-tab="overview">
                            <i class="fa-solid fa-chart-line"></i>
                            <span>Overview</span>
                        </a>
                    </li>
                    <li>
                        <a href="#users" class="nav-item" data-tab="users">
                            <i class="fa-solid fa-user-gear"></i>
                            <span>Users</span>
                        </a>
                    </li>
                    <li>
                        <a href="#groups" class="nav-item" data-tab="groups">
                            <i class="fa-solid fa-users-rectangle"></i>
                            <span>Groups</span>
                        </a>
                    </li>
                    <li>
                        <a href="#reports" class="nav-item" data-tab="reports">
                            <i class="fa-solid fa-flag"></i>
                            <span>Reports</span>
                        </a>
                    </li>
                    <li>
                        <a href="#broadcast" class="nav-item" data-tab="broadcast">
                            <i class="fa-solid fa-bullhorn"></i>
                            <span>Broadcast</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-footer">
                <a href="../../home.php" class="footer-link">
                    <i class="fa-solid fa-arrow-left"></i> Back to Site
                </a>
                <a href="../../logout.php" class="footer-link logout">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </a>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="dashboard-main">
            <!-- Sticky Header -->
            <header class="dashboard-header">
                <div class="header-title-container">
                    <h1 id="page-title">Overview</h1>
                    <p id="page-desc">System monitoring and real-time management.</p>
                </div>
                
                <div class="user-profile">
                    <div class="user-text">
                        <span class="user-name"><?php echo htmlspecialchars($data['user_firstname']); ?></span>
                        <span class="user-role">Administrator</span>
                    </div>
                    <img src="<?php echo $pfp_src; ?>" class="user-avatar" alt="Admin Avatar">
                </div>
            </header>

            <!-- Tab: Overview -->
            <section id="tab-overview" class="tab-content active">
                <div class="stats-grid">
                    <!-- Total Users -->
                    <div class="glass-card stat-card">
                        <div class="stat-header">
                            <div class="stat-icon"><i class="fa-solid fa-user"></i></div>
                            <span class="stat-title">Total Users</span>
                        </div>
                        <h3 class="stat-value" id="stat-users">--</h3>
                    </div>

                    <!-- Total Groups -->
                    <div class="glass-card stat-card">
                        <div class="stat-header">
                            <div class="stat-icon"><i class="fa-solid fa-users-rectangle"></i></div>
                            <span class="stat-title">Total Groups</span>
                        </div>
                        <h3 class="stat-value" id="stat-groups">--</h3>
                    </div>

                    <!-- Total Posts -->
                    <div class="glass-card stat-card">
                        <div class="stat-header">
                            <div class="stat-icon"><i class="fa-solid fa-signs-post"></i></div>
                            <span class="stat-title">Total Posts</span>
                        </div>
                        <h3 class="stat-value" id="stat-posts">--</h3>
                    </div>

                    <!-- Total Comments -->
                    <div class="glass-card stat-card">
                        <div class="stat-header">
                            <div class="stat-icon"><i class="fa-solid fa-comments"></i></div>
                            <span class="stat-title">Total Comments</span>
                        </div>
                        <h3 class="stat-value" id="stat-comments">--</h3>
                    </div>
                </div>

                <!-- Server Specifications -->
                <div class="glass-card content-section" style="min-height: auto; margin-bottom: 25px;">
                    <div class="section-header">
                        <h2>Server Specifications</h2>
                    </div>
                    
                    <!-- Real-time Server Stats -->
                    <div class="stats-grid" style="margin-bottom: 2rem;">
                         <!-- Disk Usage -->
                         <div class="glass-card stat-card">
                            <div class="stat-header">
                                <div class="stat-icon"><i class="fa-solid fa-hard-drive"></i></div>
                                <span class="stat-title">Disk Usage</span>
                            </div>
                            <h3 class="stat-value" id="stat-disk-used">-- / --</h3>
                            <div class="progress-track">
                                <div id="bar-disk" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>

                        <!-- RAM Usage -->
                        <div class="glass-card stat-card">
                            <div class="stat-header">
                                <div class="stat-icon"><i class="fa-solid fa-memory"></i></div>
                                <span class="stat-title">RAM Usage</span>
                            </div>
                            <h3 class="stat-value" id="stat-ram-usage">-- / -- (0%)</h3>
                            <div class="progress-track">
                                <div id="bar-ram" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>

                        <!-- CPU Load -->
                        <div class="glass-card stat-card">
                            <div class="stat-header">
                                <div class="stat-icon"><i class="fa-solid fa-microchip"></i></div>
                                <span class="stat-title">Server Load</span>
                            </div>
                            <h3 class="stat-value" id="stat-load">--%</h3>
                            <div class="progress-track">
                               <div id="bar-load" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="specs-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div class="spec-item">
                            <small style="color:var(--color-text-dim)">CPU Model</small>
                            <div id="spec-cpu" style="font-weight: 600;">...</div>
                        </div>
                        <div class="spec-item">
                            <small style="color:var(--color-text-dim)">PHP Version</small>
                            <div id="spec-php" style="font-weight: 600;">...</div>
                        </div>
                        <div class="spec-item">
                            <small style="color:var(--color-text-dim)">MySQL Version</small>
                            <div id="spec-mysql" style="font-weight: 600;">...</div>
                        </div>
                        <div class="spec-item">
                            <small style="color:var(--color-text-dim)">Darknight Version</small>
                            <div id="spec-dn" style="font-weight: 600;">...</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tab: Users -->
            <section id="tab-users" class="tab-content hidden">
                <div class="glass-card content-section">
                    <div class="section-actions">
                        <input type="text" id="user-search" class="search-field" placeholder="Search by name, nickname or ID...">
                        <button class="btn btn-primary" id="refresh-users"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
                    </div>
                    <div id="users-list" class="list-container">
                        <!-- Content injected via JS -->
                    </div>
                </div>
            </section>

            <!-- Tab: Groups -->
            <section id="tab-groups" class="tab-content hidden">
                <div class="glass-card content-section">
                    <div class="section-actions">
                        <input type="text" id="group-search" class="search-field" placeholder="Search groups...">
                        <button class="btn btn-primary" id="refresh-groups"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
                    </div>
                    <div id="groups-list" class="list-container">
                         <!-- Content injected via JS -->
                    </div>
                </div>
            </section>

            <!-- Tab: Reports -->
            <section id="tab-reports" class="tab-content hidden">
                <div class="glass-card content-section">
                     <div class="section-actions">
                        <div class="report-tabs">
                            <button class="report-tab active" data-status="0" onclick="Dashboard.switchReportTab(0)">
                                <i class="fa-solid fa-clock"></i> Pending
                                <span class="tab-badge" id="pending-count-badge">0</span>
                            </button>
                            <button class="report-tab" data-status="1" onclick="Dashboard.switchReportTab(1)">
                                <i class="fa-solid fa-check-circle"></i> Resolved
                            </button>
                            <button class="report-tab" data-status="2" onclick="Dashboard.switchReportTab(2)">
                                <i class="fa-solid fa-ban"></i> Ignored
                            </button>
                        </div>
                        <button class="btn btn-primary" id="refresh-reports"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
                    </div>
                    <div id="reports-list" class="list-container">
                         <!-- Content injected via JS -->
                    </div>
                </div>
            </section>

            <!-- Tab: Broadcast -->
            <section id="tab-broadcast" class="tab-content hidden">
                <div class="glass-card content-section" style="max-width: 800px; margin: 0 auto;">
                    <div class="section-header">
                        <h2>System-Wide Broadcast</h2>
                        <p>Broadcast a real-time message to the <strong>Global Broadcast</strong> channel. This message will be visible to all users instantly.</p>
                    </div>
                    
                    <div class="broadcast-form" style="margin-top: 30px;">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="broadcast-msg" style="display: block; margin-bottom: 10px; color: var(--color-text-dim);">Message Content</label>
                            <textarea id="broadcast-msg" class="premium-textarea" placeholder="Type your announcement here..." style="width: 100%; min-height: 150px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; padding: 15px; font-family: inherit; resize: vertical;"></textarea>
                        </div>
                        
                        <div class="broadcast-preview" id="broadcast-preview" style="display: none; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border-left: 4px solid var(--color-secondary); margin-bottom: 20px;">
                            <small style="color: var(--color-secondary); font-weight: 600; text-transform: uppercase;">Preview</small>
                            <div id="preview-text" style="margin-top: 5px;"></div>
                        </div>

                        <div class="broadcast-status" id="ws-status" style="font-size: 0.85rem; color: var(--color-text-dim); margin-bottom: 15px;">
                            <i class="fa-solid fa-circle" style="font-size: 0.6rem; margin-right: 5px; color: var(--color-danger);"></i> Disconnected from Broadcast Service
                        </div>

                        <button class="btn btn-primary" id="btn-send-broadcast" disabled style="width: 100%; justify-content: center; height: 50px; font-size: 1.1rem;">
                            <i class="fa-solid fa-paper-plane"></i> Send Broadcast
                        </button>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Modals -->
    <!-- Verification Modal -->
    <div id="modal-verify" class="modal-backdrop">
        <div class="modal-container">
            <div class="modal-header">
                <h2>Verify User</h2>
                <button class="modal-close-btn" data-close="modal-verify"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p>Select verification level for <strong id="verify-target-name">...</strong></p>
                <div class="custom-select-wrapper">
                    <select id="verify-level-select" class="premium-select">
                        <option value="0">Unverified (0)</option>
                        <option value="1">Verified User (1)</option>
                        <option value="2">Company (2)</option>
                        <option value="3">Government (3)</option>
                        <option value="4">Translator (4)</option>
                        <option value="5">Developer (5)</option>
                        <option value="19">Moderator (19)</option>
                        <option value="20">Administrator (20)</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-close="modal-verify">Cancel</button>
                <button class="btn btn-primary" id="confirm-verify">Update</button>
            </div>
        </div>
    </div>

    <!-- Confirmation Modal (Ban/Unban/Action) -->
    <div id="modal-confirm" class="modal-backdrop">
        <div class="modal-container">
            <div class="modal-header">
                <h2 id="confirm-title">Confirm Action</h2>
                <button class="modal-close-btn" data-close="modal-confirm"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p id="confirm-message">Are you sure?</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-close="modal-confirm">Cancel</button>
                <button class="btn btn-danger" id="confirm-action-btn">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Group Info Modal -->
    <div id="modal-group-info" class="modal-backdrop">
        <div class="modal-container">
            <div class="modal-header">
                <h2>Group Details</h2>
                <button class="modal-close-btn" data-close="modal-group-info"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="group-info-header" style="text-align: center; margin-bottom: 20px;">
                    <img id="g-info-img" src="../../data/blank.jpg" style="width: 80px; height: 80px; border-radius: 16px; object-fit: cover; margin-bottom: 10px;">
                    <h3 id="g-info-name" style="margin: 0; font-size: 1.4rem;">...</h3>
                    <p id="g-info-meta" style="color: var(--color-text-dim); font-size: 0.9rem; margin: 5px 0;">...</p>
                </div>
                <div class="group-info-details" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;">
                    <p><strong>Creator:</strong> <span id="g-info-creator">...</span></p>
                    <p><strong>Description:</strong> <span id="g-info-desc">...</span></p>
                    <p><strong>Privacy:</strong> <span id="g-info-privacy">...</span></p>
                    <p><strong>Members:</strong> <span id="g-info-members">...</span></p>
                    <p><strong>Status:</strong> <span id="g-info-status">...</span></p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-close="modal-group-info">Close</button>
            </div>
        </div>
    </div>

    <!-- Report Details Modal -->
    <div id="modal-report-details" class="modal-backdrop">
        <div class="modal-container">
            <div class="modal-header">
                <h2>Report Content Details</h2>
                <button class="modal-close-btn" data-close="modal-report-details"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="report-detail-body" class="modal-body">
                <div class="detail-placeholder">Loading details...</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-close="modal-report-details">Close</button>
            </div>
        </div>
    </div>

    <!-- Broadcast Confirm/Alert Modal -->
    <div id="modal-broadcast-confirm" class="modal-backdrop">
        <div class="modal-container" style="max-width: 400px;">
            <div class="modal-header">
                <h2 id="modal-broadcast-title">Confirm</h2>
                <button class="modal-close-btn" data-close="modal-broadcast-confirm"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p id="modal-broadcast-message">Are you sure?</p>
            </div>
            <div class="modal-footer" id="modal-broadcast-footer">
                <button class="btn btn-secondary" data-close="modal-broadcast-confirm">Cancel</button>
                <button class="btn btn-primary" id="modal-broadcast-ok">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Logic -->
    <script>
        window.ADMIN_USERNAME = "<?php echo htmlspecialchars($data['user_nickname']); ?>";
    </script>
    <script src="../../resources/js/custom-select.js"></script>
    <script src="../../resources/js/dashboard.js"></script>
</body>
</html>
