<?php
session_start();
require_once "includes/functions.php";
if (!_is_session_valid()) {
    if (_is_session_valid(true, true)) {
        header("Location: verify.php?t=2FA&redirect=" . urlencode($_SERVER['REQUEST_URI']));
    } else {
        header("Location: index.php");
    }
    exit();
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Darknight</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
	</head>
	<body>
		<?php include 'includes/navbar.php'; ?>
<div class="container" style="max-width: 1450px;">
    <div class="main-layout-grid">
        <!-- Left Sidebar -->
        <aside class="sidebar-left">
            <div class="glass-panel hover-scale" style="padding: 24px; border-radius: var(--border-radius-lg); text-align: center; cursor: pointer;" onclick="changeUrl('/profile.php')">
                <img class="pfp" src="data/blank.jpg" id="pfp_side" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid var(--color-primary); margin-bottom: 12px; object-fit: cover;">
                <h3 id="username_side" class="text-gradient" style="margin: 0; font-size: 1.2rem;">My Profile</h3>
                <p style="color: var(--color-text-secondary); margin-top: 5px; font-size: 0.9rem;">View your timeline</p>
            </div>
            
            <div class="glass-panel" style="margin-top: 20px; padding: 0; border-radius: var(--border-radius-lg); overflow: hidden;">
                <div style="padding: 15px 20px; border-bottom: 1px solid var(--color-surface-border);">
                    <h4 style="margin: 0;">Shortcuts</h4>
                </div>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li><a href="/friends.php" class="sidebar-link" onclick="changeUrl('/friends.php'); return false;" style="display: block; padding: 12px 20px; color: var(--color-text-secondary); transition: all 0.2s;"><i class="fa-solid fa-user-group" style="width: 25px;"></i> Friends</a></li>
                    <li><a href="/groups.php" class="sidebar-link" onclick="changeUrl('/groups.php'); return false;" style="display: block; padding: 12px 20px; color: var(--color-text-secondary); transition: all 0.2s;"><i class="fa-solid fa-users" style="width: 25px;"></i> Groups</a></li>
                    <li><a href="/settings.php" class="sidebar-link" onclick="changeUrl('/settings.php'); return false;" style="display: block; padding: 12px 20px; color: var(--color-text-secondary); transition: all 0.2s;"><i class="fa-solid fa-gear" style="width: 25px;"></i> Settings</a></li>
                </ul>
            </div>
        </aside>

        <!-- Main Feed -->
        <main class="feed-container">
            <input type="hidden" id="page" value="0">
            
            <div class="createpost_box glass-panel" style="padding: 20px; border-radius: var(--border-radius-lg); margin-bottom: 24px;">
                <a href="/profile.php" title="My Profile" onclick="changeUrl('/profile.php'); return false;">
                    <img class="pfp" src="data/blank.jpg" id="pfp_box" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </a>
                <div class="input_box" onclick="make_post()" data-lang="lang__094" style="background: var(--color-surface-hover); border-radius: 30px; padding: 12px 20px; margin-left: 12px; height: auto;">
                    What's on your mind?
                </div>
                <div class="post-actions" style="margin-left: auto;">
                    <button class="btn-primary" style="padding: 8px 20px; border-radius: 20px; height: auto; font-size: 0.9rem;"><i class="fa-solid fa-plus"></i> Post</button>
                </div>
            </div>
            
            <div id="feed">
                <!-- Posts will be loaded here via JS -->
            </div>
            
            <div style="height: 100px;"></div> <!-- Spacer -->
        </main>
        
        <!-- Right Sidebar -->
        <aside class="sidebar-right">
            <div class="glass-panel" style="padding: 20px; border-radius: var(--border-radius-lg);" id="trending_box">
                <h4 style="margin-top: 0; margin-bottom: 15px;">Trending</h4>
                <div style="color: var(--color-text-dim); font-size: 0.9rem; padding: 10px 0;">
                    Loading...
                </div>
            </div>
            
            <footer style="margin-top: 20px; text-align: center; color: var(--color-text-dim); font-size: 0.8rem;">
                &copy; 2026 Darknight<br>
                <a href="/pages/privacy/" style="color: var(--color-text-dim);">Privacy</a> &middot; <a href="/pages/tos/" style="color: var(--color-text-dim);">Terms</a>
            </footer>
        </aside>
    </div>
</div>

<!-- Inline script to populate sidebar data if possible, or update main.js -> Let's try simple inline logic -->
		<script>
            // Initial load for direct page access
            fetch_post("Post.php?scope=feed");
            fetch_pfp_box();
            loadTrending();
		</script>
        
        <?php include 'includes/chat_widget.php'; ?>
	</body>
</html>