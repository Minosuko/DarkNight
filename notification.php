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
                <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="markAllRead()">
                    Mark all as read
                </button>
            </div>
            <ul class="notification-list" id="notification-list">
                <div style="padding:20px; text-align:center; color:var(--color-text-secondary);">
                    <i class="fa-solid fa-spinner fa-spin"></i> Loading...
                </div>
            </ul>
        </div>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            loadNotifications();
        });
    </script>
</body>
</html>
