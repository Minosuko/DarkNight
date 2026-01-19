<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Terms of Service - Darknight</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="../../resources/css/index.css">
    <link rel="stylesheet" type="text/css" href="../../resources/css/main.css">
    <link rel="stylesheet" type="text/css" href="../../resources/css/font-awesome/all.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        .tos-container {
            max-width: 800px;
            width: 95%;
            margin: 2rem auto;
            max-height: 85vh;
            overflow-y: auto;
            padding-right: 1.5rem;
        }
        .tos-content {
            text-align: left;
        }
        .tos-content section {
            margin-bottom: 2rem;
        }
        .tos-content h2 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: var(--primary-color);
            font-size: 1.5rem;
            border-bottom: 1px solid var(--glass-border);
            padding-bottom: 0.5rem;
        }
        .tos-content p {
            line-height: 1.7;
            color: var(--text-muted);
            margin-bottom: 1rem;
            font-size: 0.95rem;
        }
        .tos-content ul {
            color: var(--text-muted);
            margin-bottom: 1rem;
            padding-left: 1.5rem;
        }
        .tos-content li {
            margin-bottom: 0.5rem;
            line-height: 1.5;
        }
        .back-link {
            display: inline-block;
            margin-top: 1rem;
            margin-bottom: 2rem;
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateX(-5px);
            text-decoration: underline;
        }
        /* Custom scrollbar */
        .tos-container::-webkit-scrollbar {
            width: 6px;
        }
        .tos-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .tos-container::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 10px;
        }
        
        /* Language Switcher UI */
        .custom-select-wrapper select:hover {
            border-color: var(--primary-color);
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
        }
        .custom-select-wrapper select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.2);
        }
        .custom-select-wrapper select option {
            background: #1a1a1a;
            color: #fff;
            padding: 10px;
        }
        @media (max-width: 600px) {
            .tos-lang-switcher {
                position: relative !important;
                margin-bottom: 1.5rem;
                justify-content: center;
            }
            .custom-select-wrapper {
                width: 100% !important;
            }
        }
    </style>
</head>
<body>
    <div class="bg-animation">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
    </div>

    <main class="tos-container glass-card">
        <header class="login-header" style="position: relative; margin-bottom: 2rem;">
            <h1>Terms of Service</h1>
            <p style="margin-top: 0.5rem; color: var(--text-muted); font-size: 0.85rem;">Last updated: <?php echo date('F d, Y'); ?></p>
            <div class="tos-lang-switcher" style="position: absolute; top: 0; right: 0; display: flex; align-items: center;">
                <div class="custom-select-wrapper" style="position: relative; width: 220px;">
                    <select id="tos-lang-select" class="tos-select" onchange="switchTOSLanguage(this.value)">
                        <option value="en-us">English (US)</option>
                        <option value="ko-kr">한국어 (Korean)</option>
                        <option value="ja-jp">日本語 (Japanese)</option>
                        <option value="zh-cn">简体中文 (Chinese)</option>
                        <option value="vi-vn">Tiếng Việt (Vietnamese)</option>
                        <option value="fil-ph">Filipino (Filipino)</option>
                        <option value="id-id">Bahasa Indonesia (Indonesian)</option>
                        <option value="th-th">ไทย (Thai)</option>
                        <option value="fr-fr">Français (French)</option>
                    </select>
                </div>
            </div>
        </header>

        <div class="tos-content" id="tos-content-area">
            <?php
            $lang = isset($_GET['lang']) ? $_GET['lang'] : 'en-us';
            $lang_file = __DIR__ . "/langs/{$lang}.php";
            if (!file_exists($lang_file)) {
                $lang_file = __DIR__ . "/langs/en-us.php";
            }
            include $lang_file;
            ?>
            <a href="../../index.php" class="back-link">← Back to Registration</a>
        </div>

        <script src="../../resources/js/jquery.js"></script>
        <script src="../../resources/js/custom-select.js?v=<?php echo time(); ?>"></script>
        <script>
            function switchTOSLanguage(lang) {
                // Also update site language
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem("language", lang);
                }
                window.location.href = "?lang=" + lang;
            }

            // Sync selector with URL or localStorage
            document.addEventListener('DOMContentLoaded', function() {
                const urlParams = new URLSearchParams(window.location.search);
                const langParam = urlParams.get('lang');
                const localLang = localStorage.getItem("language");
                const currentLang = langParam || localLang || 'en-us';
                
                document.getElementById('tos-lang-select').value = currentLang;
                initCustomSelects();
            });
        </script>
    </main>
</body>
</html>
