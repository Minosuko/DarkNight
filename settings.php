<!DOCTYPE html>
<html>
<head>
    <title>Darknight - Settings</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="resources/css/main.css">
    <link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
    <link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>
    
    <div class="container">
        <div class="settings-container">
            <!-- Sidebar -->
            <div class="settings-sidebar">
                <ul>
                    <li>
                        <a href="?tab=account" id="tab-account" onclick="changeTab('account'); return false;">
                            <i class="fa-solid fa-address-card"></i> Account
                        </a>
                    </li>
                    <li>
                        <a href="?tab=device" id="tab-device" onclick="changeTab('device'); return false;">
                            <i class="fa-solid fa-desktop"></i> Devices
                        </a>
                    </li>
                    <li>
                        <a href="?tab=profile" id="tab-profile" onclick="changeTab('profile'); return false;">
                            <i class="fa-solid fa-user"></i> Profile
                        </a>
                    </li>
                    <li>
                        <a href="?tab=appearance" id="tab-appearance" onclick="changeTab('appearance'); return false;">
                            <i class="fa-solid fa-palette"></i> Appearance
                        </a>
                    </li>
                    <li>
                        <a href="?tab=about" id="tab-about" onclick="changeTab('about'); return false;">
                            <i class="fa-solid fa-circle-info"></i> About
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Content -->
            <div class="settings-content">
                
                <!-- ACCOUNT TAB -->
                <div id="setting-tab-account" style="display:none;">
                    <h2 class="setting-section-title">Account Settings</h2>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Nickname</label>
                            <div class="setting-value" id="display_nickname">Loading...</div>
                            <input type="hidden" id="usernickname">
                        </div>
                        <div class="setting-action">
                            <button class="setting-btn" onclick="_change_infomation(1)">Edit</button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Email</label>
                            <div class="setting-value" id="display_email">Loading...</div>
                            <input type="hidden" id="email">
                        </div>
                        <div class="setting-action">
                            <button class="setting-btn" onclick="_change_infomation(2)">Edit</button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Password</label>
                            <div class="setting-value">••••••••</div>
                        </div>
                        <div class="setting-action">
                            <button class="setting-btn" onclick="_change_infomation(0)">Change</button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Verification Status</label>
                            <div class="setting-value">
                                <span id="verified-text">checking...</span>
                                <i id="verified" style="margin-left:5px;"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Two-Factor Authentication</label>
                            <div class="setting-value" id="2fa-status-text">Checking...</div>
                        </div>
                        <div class="setting-action">
                            <button class="setting-btn" id="2fa-btn" onclick="_manage_2fa()">Manage</button>
                        </div>
                    </div>

                    <div class="setting-item" style="border:none; margin-top:20px;">
                        <a href="/logout.php" style="text-decoration:none;">
                            <button class="s_button red_alert" style="width:100%;">
                                Log Out <i class="fa-solid fa-right-from-bracket"></i>
                            </button>
                        </a>
                    </div>
                </div>

                <!-- PROFILE TAB -->
                <div id="setting-tab-profile" style="display:none;">
                    <h2 class="setting-section-title">Profile Settings</h2>
                    
                    <div class="setting-profile-preview">
                        <div id="setting_profile_cover" class="setting-cover-banner">
                            <button class="cover-edit-badge" onclick="_change_picture(1)" title="Edit Cover Photo">
                                <i class="fa-solid fa-camera"></i>
                            </button>
                        </div>
                        <div class="setting-pfp-wrapper">
                            <img src="data/blank.jpg" id="profile_picture" class="setting_profile_picture">
                            <button class="pfp-edit-badge" onclick="_change_picture(0)" title="Edit Profile Picture">
                                <i class="fa-solid fa-camera"></i>
                            </button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Personal Information</label>
                            <div class="setting-value">Name, Bio, Birthday, Gender, Hometown</div>
                        </div>
                        <div class="setting-action">
                            <button class="btn-primary" onclick="modal_open('settings')">Edit Profile</button>
                        </div>
                    </div>
                    
                    <!-- Hidden inputs for JS compatibility if needed by _load_settings to avoid errors -->
                    <div style="display:none;">
                        <input id="userfirstname"><input id="userlastname">
                        <input id="userabout"><input id="userhometown">
                        <input id="birthday">
                        <input type="radio" id="malegender"><input type="radio" id="femalegender"><input type="radio" id="othergender">
                        <div id="setting_profile_cover"></div>
                    </div>
                </div>

                <!-- APPEARANCE TAB -->
                <div id="setting-tab-appearance" style="display:none;">
                    <h2 class="setting-section-title">Appearance Settings</h2>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Display Theme</label>
                            <div class="setting-value">Switch between light and dark modes</div>
                        </div>
                        <div class="setting-action">
                            <div class="theme-switch-container" id="setting-theme-toggle" onclick="toggleTheme()" style="width:52px; height:28px; background:var(--color-primary); border-radius:14px; position:relative; cursor:pointer; overflow:hidden;">
                                <div class="theme-switch-slider" style="width:24px; height:24px; background:white; border-radius:50%; position:absolute; top:2px; left:26px; transition:left 0.2s cubic-bezier(0.4, 0, 0.2, 1); display:flex; align-items:center; justify-content:center; color:var(--color-primary); font-size:12px;">
                                    <i class="fa-solid fa-moon"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label class="setting-label">Primary Color</label>
                            <div class="setting-value">Choose your favorite accent color</div>
                            <div class="color-presets" style="margin-top:15px;">
                                <div class="color-preset" data-hue="210" onclick="setPrimaryHue(210)" style="background:#007aff"></div>
                                <div class="color-preset" data-hue="270" onclick="setPrimaryHue(270)" style="background:#af52de"></div>
                                <div class="color-preset" data-hue="330" onclick="setPrimaryHue(330)" style="background:#ff2d55"></div>
                                <div class="color-preset" data-hue="0" onclick="setPrimaryHue(0)" style="background:#ff3b30"></div>
                                <div class="color-preset" data-hue="30" onclick="setPrimaryHue(30)" style="background:#ff9500"></div>
                                <div class="color-preset" data-hue="120" onclick="setPrimaryHue(120)" style="background:#34c759"></div>
                            </div>
                        </div>
                    </div>

                    <div class="setting-item" style="border:none;">
                        <div class="setting-info">
                            <label class="setting-label"><lang lang="lang__085">Language</lang></label>
                            <div class="setting-value"><lang lang="lang__086">Select your preferred language</lang></div>
                        </div>
                        <div class="setting-action">
                            <select id="setting-language-select" class="setting-select" onchange="changeLanguage(this.value)">
                                <option value="en-us">English</option>
                                <option value="vi-vn">Tiếng Việt</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="setting-tab-device" style="display:none;">
                    <h2 class="setting-section-title">Active Sessions</h2>
                    <div style="margin-bottom: 20px;">
                        <button class="btn-danger-outline" onclick="_revoke_all_sessions()" style="width:100%;">
                            <i class="fa-solid fa-right-from-bracket"></i> Log Out All Other Devices
                        </button>
                    </div>
                    <div id="session-list">
                        <div style="text-align:center; padding:20px; color:var(--color-text-dim);">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Loading sessions...
                        </div>
                    </div>
                </div>

                <!-- ABOUT TAB -->
                <div id="setting-tab-about" style="display:none;">
                    <h2 class="setting-section-title">About</h2>
                    
                    <a href="https://fb.com/MinoFoxc" target="_blank" class="social-link-item">
                        <i class="fa-brands fa-facebook" style="color:#1877F2"></i> Facebook
                    </a>
                    <a href="https://x.com/MinosukoUwU" target="_blank" class="social-link-item">
                        <i class="fa-brands fa-x-twitter"></i> X (Twitter)
                    </a>
                    <a href="https://github.com/Minosuko" target="_blank" class="social-link-item">
                        <i class="fa-brands fa-github"></i> Github
                    </a>
                    <a href="https://bsky.app/profile/minosuko.love" target="_blank" class="social-link-item">
                        <i class="fa-solid fa-cloud" style="color:#0085ff"></i> BlueSky
                    </a>
                    <a href="mailto:dev3.darknight@gmail.com" class="social-link-item">
                        <i class="fa-solid fa-envelope" style="color:#EA4335"></i> Support Email
                    </a>
                    <div style="margin-top:20px; text-align:center;">
                        <a href='https://ko-fi.com/X8X8CYLKP' target="_blank" rel="noopener noreferrer">
                            <img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee' />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof _load_settings === 'function') {
                _load_settings();
            } else {
                console.error('Core scripts not loaded.');
            }
        });
    </script>
</body>
</html>