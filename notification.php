<!DOCTYPE html>
<html>
<head>
    <title>Darknight - Notifications</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="resources/css/main.css">
    <link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <div class="container">
        <div class="notification-container">
            <div class="notification-header">
                <h3>Notifications</h3>
                <div style="display:flex; gap:15px; align-items:center;">
                    <div class="notif-tabs">
                        <div class="notif-tab active" data-filter="all" onclick="switchNotifTab('all')">All</div>
                        <div class="notif-tab" data-filter="unread" onclick="switchNotifTab('unread')">Unread</div>
                    </div>
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="markAllRead()">
                        Mark all as read
                    </button>
                </div>
            </div>
            <ul class="notification-list" id="notification-list">
                <div style="padding:40px; text-align:center; color:var(--color-text-secondary);">
                    <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                    <p style="margin-top:10px;">Loading notifications...</p>
                </div>
            </ul>
        </div>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            loadNotifications();
        });

        function switchNotifTab(filter) {
            document.querySelectorAll('.notif-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.filter === filter) tab.classList.add('active');
            });
            loadNotifications(filter);
        }
    </script>
    <?php include 'includes/chat_widget.php'; ?>
</body>
</html>
