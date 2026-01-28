<?php
ob_start();
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
    <title>DarkMessage | DarkNight</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="resources/css/main.css">
    <link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
    
    <?php 
    $isWidget = (isset($_GET['mode']) && $_GET['mode'] === 'widget');
    ?>

    <style>
        #mini-chat-widget { display: none !important; }

        :root {
            --dm-neon-blue: #00f3ff;
            --dm-neon-purple: #bc13fe;
            --dm-bg-dark: #050507;
            --dm-surface: rgba(20, 20, 25, 0.7);
            --dm-border: rgba(255, 255, 255, 0.1);
            --dm-msg-me: linear-gradient(135deg, #0084ff, #00dfd8);
            --dm-msg-them: rgba(45, 45, 55, 0.6);
            --dm-text-main: #f0f2f5;
            --dm-text-dim: #a0a3b1;
        }

        #messenger-container {
            display: grid;
            grid-template-columns: 320px 1fr;
            width: 100%;
            background: transparent;
            border: none;
            border-radius: 0;
            overflow: hidden;
            box-shadow: none;
            margin: 0;
            position: fixed;
            top: <?php echo $isWidget ? '0' : '70px'; ?>; /* 70px matches main.css navbar */
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
        }

        html, body { 
            height: 100vh; 
            margin: 0; 
            padding: 0; 
            overflow: hidden; 
            font-family: 'Outfit', -apple-system, sans-serif;
            background-color: var(--dm-bg-dark);
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(0, 243, 255, 0.05), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(188, 19, 254, 0.05), transparent 25%);
            color: var(--dm-text-main);
        }

        .container {
            width: 100%;
            height: 100%;
        }

        <?php if($isWidget): ?>
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--dm-neon-blue); border-radius:10px; box-shadow: 0 0 5px var(--dm-neon-blue); }
        ::-webkit-scrollbar-track { background: transparent; }
        
        body { overflow:hidden; background:#000; font-size: 14px; }
        .container { padding:0 !important; margin:0 !important; max-width:100% !important; height: 100% !important; }
        
        /* Smooth View Switching */
        .dm-sidebar, .dm-main {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        #messenger-container {
            grid-template-columns: 100%;
            width: 100% !important;
            height: 100% !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
        }

        .dm-main { 
            transform: translateX(100%);
            opacity: 0;
            display: flex !important; 
            flex-direction: column;
            pointer-events: none;
        } 
        
        .show-chat .dm-sidebar { 
            transform: translateX(-20%);
            opacity: 0;
            pointer-events: none;
        }

        .show-chat .dm-main { 
            transform: translateX(0);
            opacity: 1;
            pointer-events: auto;
        }
        
        /* compact styles */
        .dm-main-header, .dm-sidebar-header { padding: 12px 15px; background: rgba(10,10,10,0.95) !important; border-bottom: 1px solid #1a1a1a; }
        .dm-search-bar { padding: 8px 12px; background: #080808 !important; }
        .dm-input-area { padding: 12px !important; background: #080808 !important; }
        .dm-input-area input { padding: 8px 16px !important; font-size: 0.9rem; }
        .dm-send-btn { font-size: 1.2rem !important; }
        #messages { padding: 15px !important; }
        .msg-wrapper { max-width: 92%; }
        .bubble { padding: 8px 14px !important; font-size: 0.9rem !important; width: -webkit-fill-available; }
        
        /* Back button visibility */
        .widget-back-btn { display: flex !important; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.05); margin-right: 12px; color: var(--dm-neon-blue); cursor: pointer; }
        
        /* Modal tweaks */
        .picker-card, .auth-card {
            width: 90% !important;
            max-height: 80% !important;
            padding: 20px !important;
        }
        <?php else: ?>
        .widget-back-btn { display: none !important; }
        .dm-sidebar, .dm-main { position: relative; width: 100%; height: 100%; }
        <?php endif; ?>

        /* Sidebar: Conversations */
        .dm-sidebar {
            border-right: 1px solid var(--dm-border);
            display: flex;
            flex-direction: column;
            background: var(--dm-surface);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }

        .dm-sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--dm-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .dm-sidebar-header h2 {
            margin: 0;
            font-size: 1.2rem;
            color: var(--dm-neon-blue);
        }

        .dm-search-bar {
            padding: 12px 20px;
            border-bottom: 1px solid var(--dm-border);
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(0, 0, 0, 0.2);
        }

        .dm-search-bar input {
            background: transparent;
            border: none;
            color: white;
            width: 100%;
            outline: none;
            font-size: 0.9rem;
        }

        .dm-search-bar i {
            color: #666;
        }

        /* User Picker Modal */
        #modal-user-picker {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 200;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        }

        .picker-card {
            width: 450px;
            height: 550px;
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid var(--dm-border);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .picker-header {
            padding: 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .picker-header h3 { margin: 0; color: white; }

        .picker-body {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .picker-item {
            display: flex;
            align-items: center;
            padding: 10px;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
        }
        .picker-item:hover { background: #222; }
        .picker-item img { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; }

        .conversation-list {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        .conversation-item {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid #1a1a1a;
        }

        .conversation-item:hover {
            background: #1a1a1a;
        }

        .conversation-item.active {
            background: linear-gradient(90deg, rgba(0, 243, 255, 0.15), rgba(0, 243, 255, 0.05));
            border-left: 3px solid var(--dm-neon-blue);
            box-shadow: inset 8px 0 20px rgba(0, 243, 255, 0.1);
            position: relative;
        }

        .conversation-item.active::after {
            content: '';
            position: absolute;
            left: 0;
            top: 15%;
            bottom: 15%;
            width: 3px;
            background: var(--dm-neon-blue);
            filter: blur(4px);
            z-index: 1;
        }

        .avatar-small {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            margin-right: 15px;
            object-fit: cover;
            border: 1px solid var(--dm-border);
            transition: transform 0.3s ease;
        }

        .conversation-item:hover .avatar-small {
            transform: scale(1.05);
            border-color: var(--dm-neon-blue);
        }

        .conv-info {
            flex: 1;
            min-width: 0;
        }

        .conv-name {
            font-weight: 600;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .verified-badge {
            font-size: 0.8rem;
        }

        .verified_color_1 { 
            color: var(--dm-neon-blue); 
            filter: drop-shadow(0 0 3px var(--dm-neon-blue));
        }

        .verified_color_2 { 
            color: #FFD700; 
            filter: drop-shadow(0 0 3px #FFD700);
        }

        .verified_color_20 { 
            color: var(--dm-neon-purple); 
            filter: drop-shadow(0 0 5px var(--dm-neon-purple));
        }

        .conv-last-msg {
            font-size: 0.85rem;
            color: #888;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Main Chat Area */
        .dm-main {
            display: flex;
            flex-direction: column;
            background: #050505;
            position: relative;
            min-height: 0;
            overflow: hidden;
        }

        .dm-main-header {
            padding: 15px 25px;
            border-bottom: 1px solid var(--dm-border);
            display: flex;
            align-items: center;
            background: rgba(5, 5, 7, 0.4);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            z-index: 10;
        }

        .active-pfp {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 12px;
            border: 1px solid var(--dm-neon-blue);
        }

        .active-info h3 {
            margin: 0;
            font-size: 1rem;
        }

        .active-status {
            font-size: 0.75rem;
            color: var(--dm-neon-blue);
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .active-status::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            background: var(--dm-neon-blue);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--dm-neon-blue);
            animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
            0% { transform: scale(0.9); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px var(--dm-neon-blue); }
            100% { transform: scale(0.9); opacity: 0.7; }
        }

        #messages {
            flex: 1;
            padding: 25px;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            gap: 8px;
            /* scroll-behavior: smooth; REMOVED to allow JS control */
            min-height: 0;
            width: 100%;
            background: transparent;
        }

        /* Messenger Bubbles */
        .msg-wrapper {
            display: flex;
            margin-bottom: 2px;
            max-width: 85%;
            transition: margin 0.2s ease;
        }

        .msg-wrapper.stacked {
            margin-top: -6px;
        }

        .msg-wrapper.me {
            align-self: flex-end;
            margin-left: auto;
            flex-direction: column;
            align-items: flex-end;
        }

        .msg-wrapper.them {
            align-self: flex-start;
            margin-right: auto;
            flex-direction: column;
            align-items: flex-start;
        }

        .message-sender {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--dm-neon-blue);
            margin-bottom: 4px;
            margin-left: 12px;
            opacity: 0.8;
        }

        .me .message-sender {
            margin-left: 0;
            margin-right: 12px;
            color: var(--dm-neon-purple);
        }

        .msg-wrapper.stacked .message-sender {
            display: none;
        }

        .bubble {
            padding: 12px 18px;
            border-radius: 20px;
            font-size: 0.95rem;
            line-height: 1.5;
            position: relative;
            word-wrap: break-word;
            white-space: pre-wrap;
            animation: msg-enter 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }

        @keyframes msg-enter {
            from { opacity: 0; transform: translateY(10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }


        .me .bubble {
            background: var(--dm-msg-me);
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 15px rgba(0, 132, 255, 0.3);
        }

        .me.stacked .bubble {
            border-top-right-radius: 4px;
        }

        .them .bubble {
            background: var(--dm-msg-them);
            color: var(--dm-text-main);
            border-bottom-left-radius: 4px;
            border: 1px solid var(--dm-border);
            backdrop-filter: blur(10px);
        }

        .them.stacked .bubble {
            border-top-left-radius: 4px;
        }

        .bubble-row {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            max-width: 100%;
        }

        .me .bubble-row {
            flex-direction: row;
            justify-content: flex-end;
        }

        .them .bubble-row {
            flex-direction: row;
            justify-content: flex-start;
        }

        .msg-meta {
            font-size: 0.65rem;
            color: #555;
            white-space: nowrap;
            margin-bottom: 4px; /* Align slightly above the bottom of the bubble */
            opacity: 0.6;
            font-family: 'Consolas', monospace;
            transition: opacity 0.2s;
        }

        .msg-meta.me { 
            text-align: right; 
        }

        /* Input Area */
        .dm-input-area {
            padding: 20px;
            background: #0a0a0a;
            border-top: 1px solid var(--dm-border);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .dm-input-area textarea {
            flex: 1;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--dm-border);
            border-radius: 24px;
            color: white;
            outline: none;
            transition: all 0.3s ease;
            resize: none;
            font-family: inherit;
            font-size: 0.95rem;
            max-height: 150px;
            overflow-y: auto;
            line-height: 1.5;
        }

        .dm-input-area textarea:focus {
            border-color: var(--dm-neon-blue);
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.1);
        }

        .dm-send-btn {
            background: none;
            border: none;
            color: var(--dm-neon-blue);
            font-size: 1.4rem;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.1s;
        }

        .dm-send-btn:hover {
            transform: scale(1.1);
            text-shadow: 0 0 10px var(--dm-neon-blue);
        }

        /* Auth Overlay - Re-styled for focus */
        #auth-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        }

        .auth-card {
            width: 340px;
            background: #111;
            padding: 40px;
            border: 1px solid var(--dm-neon-blue);
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 0 40px rgba(0, 243, 255, 0.2);
        }

        .auth-card h1 {
            color: var(--dm-neon-blue);
            font-family: 'Consolas', monospace;
            font-size: 1.5rem;
            margin-bottom: 30px;
        }

        .auth-field {
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            background: #000;
            border: 1px solid #333;
            color: white;
            border-radius: 6px;
            box-sizing: border-box;
        }

        .auth-btn {
            width: 100%;
            padding: 12px;
            background: var(--dm-neon-blue);
            color: black;
            font-weight: bold;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }

        .hidden { display: none !important; }
        
        .system-msg {
            text-align: center;
            font-size: 0.75rem;
            color: #444;
            margin: 10px 0;
            font-style: italic;
        }

        .attachment-preview {
            max-width: 200px;
            border-radius: 12px;
            margin-top: 10px;
            display: block;
        }
    </style>
</head>
<body>
    <?php if(!$isWidget) include 'includes/navbar.php'; ?>
    <div class="container">
        
        <div id="messenger-container" class="<?php echo $isWidget ? 'widget-mode' : ''; ?>">
            <!-- Conversations Sidebar -->
            <div class="dm-sidebar">
                <div class="dm-sidebar-header">
                    <h2>Chats</h2>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <i class="fa-solid fa-pen-to-square" id="btn-new-chat" style="color: var(--dm-neon-blue); cursor:pointer;" title="New Chat"></i>
                    </div>
                </div>
                <div class="dm-search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="chat-search" name="chat-search" placeholder="Search messages, users..." autocomplete="off">
                </div>
                <div class="conversation-list" id="conv-list">
                    <!-- Dynamic List -->
                    <div class="conversation-item active" id="conv-global" onclick="selectConversation('global', 'Global Broadcast')" data-timestamp="0">
                        <div class="avatar-small" style="display:flex; justify-content:center; align-items:center; background:#111; border:1px solid #333;">
                            <i class="fa-solid fa-earth-asia" style="color:var(--dm-neon-blue); font-size:1.2rem;"></i>
                        </div>
                        <div class="conv-info">
                            <div class="conv-name">Global Broadcast</div>
                            <div class="conv-last-msg" id="last-msg-global">Real-time Admin Broadcast</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Chat View -->
            <div class="dm-main">
                <div class="dm-main-header">
                    <i class="fa-solid fa-arrow-left widget-back-btn" onclick="toggleWidgetView(false)"></i>
                    <img src="data/blank.jpg" class="active-pfp" style="display:none;">
                    <i class="fa-solid fa-earth-asia active-icon" style="color:var(--dm-neon-blue); font-size:2.5rem; margin-right:15px; display:block;"></i>
                    <div class="active-info">
                        <h3 id="active-chat-name">Global Broadcast</h3>
                        <span class="active-status">● Public Broadcast</span>
                    </div>
                </div>

                <div id="messages">
                </div>

                <div class="dm-input-area">
                    <input type="file" id="dm-file-input" accept="image/*,video/*" class="hidden">
                    <i class="fa-solid fa-circle-plus" style="color:#555; cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('dm-file-input').click()"></i>
                    <i class="fa-solid fa-image" style="color:#555; cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('dm-file-input').click()"></i>
                    <textarea id="message-input" placeholder="Aa" rows="1" disabled></textarea>
                    <button id="send-btn" class="dm-send-btn" disabled>
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>

                <!-- Identity Overlay -->
                <div id="auth-overlay" class="hidden">
                    <div class="auth-card">
                        <h1>CONNECT IDENTITY</h1>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">Protecting E2E Vault for: <b><?php echo htmlspecialchars(_get_data_from_token()['user_nickname']); ?></b></p>
                        <input type="text" id="pin-input" class="auth-field" placeholder="Enter 6-digit PIN" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" autocomplete="off" style="text-align:center; letter-spacing:8px; font-size:1.5rem;">
                        <button id="login-btn" class="auth-btn">CONNECT IDENTITY</button>
                        <div id="auth-msg" style="color: #ff4d4d; font-size: 0.8rem; margin-top: 15px;"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- User Picker Modal -->
        <div id="modal-user-picker" class="hidden">
            <div class="picker-card">
                <div class="picker-header">
                    <h3>New Message</h3>
                    <i class="fa-solid fa-xmark" style="cursor:poiner; font-size: 1.2rem;" onclick="document.getElementById('modal-user-picker').classList.add('hidden')"></i>
                </div>
                <div class="dm-search-bar" style="background: transparent;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="picker-search" placeholder="Search people...">
                </div>
                <div class="picker-body" id="picker-list">
                    <div style="text-align:center; color:#666; margin-top:20px;">Loading friends...</div>
                </div>
            </div>
        </div>

    </div>

    <!-- Scripts -->
    <script>
        const SOCIAL_IDENTITY = "<?php echo htmlspecialchars(_get_data_from_token()['user_nickname']); ?>";
        if(typeof loadTrending === 'function') loadTrending();

        function toggleWidgetView(showChat) {
            const container = document.getElementById('messenger-container');
            if (showChat) {
                container.classList.add('show-chat');
            } else {
                container.classList.remove('show-chat');
            }
        }

        if (typeof initDarkChat === 'function') {
            initDarkChat();
        }
    </script>
    <script src="resources/js/chat.js"></script>
    <?php include 'includes/chat_widget.php'; ?>
</body>
</html>
