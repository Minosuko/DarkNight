
<!-- Floating Chat Widget -->
<div id="mini-chat-widget" class="chat-widget-closed">
    <!-- Closed State: Floating Icon -->
    <div class="chat-widget-icon" onclick="toggleChatWidget()" title="Open Chat">
        <i class="fa-solid fa-message"></i>
    </div>
    
    <!-- Open State: Mini Chat Interface -->
    <div class="chat-widget-container">
        <div class="chat-widget-header">
            <h4>DarkMessage</h4>
            <div class="widget-controls">
                <i class="fa-solid fa-expand" onclick="window.location.href='/DarkMessage.php'" title="Full Screen"></i>
                <i class="fa-solid fa-xmark" onclick="toggleChatWidget()"></i>
            </div>
        </div>
        <!-- Iframe for isolation and easy integration -->
        <iframe src="" id="chat-iframe" style="width:100%; height:100%; border:none;"></iframe>
    </div>
</div>
