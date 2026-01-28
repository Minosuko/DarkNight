<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Privacy Policy - Darknight</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="../../resources/css/index.css">
    <link rel="stylesheet" type="text/css" href="../../resources/css/main.css">
    <link rel="stylesheet" type="text/css" href="../../resources/css/font-awesome/all.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        .privacy-container {
            max-width: 800px;
            width: 95%;
            margin: 2rem auto;
            max-height: 85vh;
            overflow-y: auto;
            padding-right: 1.5rem;
        }
        .privacy-content {
            text-align: left;
        }
        .privacy-content section {
            margin-bottom: 2.5rem;
        }
        .privacy-content h2 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: var(--color-primary);
            font-size: 1.4rem;
            border-bottom: 1px solid var(--color-surface-border);
            padding-bottom: 0.5rem;
        }
        .privacy-content p {
            line-height: 1.8;
            color: var(--color-text-secondary);
            margin-bottom: 1rem;
            font-size: 0.95rem;
        }
        .privacy-content ul {
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
        }
        .privacy-content li {
            margin-bottom: 0.7rem;
            line-height: 1.6;
        }
        .back-link {
            display: inline-block;
            margin-top: 1rem;
            margin-bottom: 2rem;
            color: var(--color-primary);
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateX(-5px);
            text-decoration: underline;
        }
        /* Custom scrollbar */
        .privacy-container::-webkit-scrollbar {
            width: 6px;
        }
        .privacy-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .privacy-container::-webkit-scrollbar-thumb {
            background: var(--color-primary);
            border-radius: 10px;
        }
        
        .privacy-lang-switcher {
            position: absolute; 
            top: 20px; 
            right: 20px; 
            display: flex; 
            align-items: center;
        }

        @media (max-width: 600px) {
            .privacy-lang-switcher {
                position: relative !important;
                top: 0;
                right: 0;
                margin-bottom: 1.5rem;
                justify-content: center;
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

    <main class="privacy-container glass-panel" style="padding: 40px; position: relative;">
        <header style="margin-bottom: 3rem; position: relative;">
            <h1 class="text-gradient" style="font-size: 2.5rem; margin: 0;">Privacy Policy</h1>
            <p style="margin-top: 0.8rem; color: var(--color-text-dim); font-size: 0.9rem;">
                Last updated: <?php echo date('F d, Y'); ?>
            </p>
            
            <div class="privacy-lang-switcher">
                <select id="privacy-lang-select" class="premium-select-sm" onchange="switchLanguage(this.value)" style="width: 180px;">
                    <option value="en-us">English (US)</option>
                </select>
            </div>
        </header>

        <div class="privacy-content" id="privacy-content-area">
            <?php
            $lang = isset($_GET['lang']) ? $_GET['lang'] : 'en-us';
            // Sanitize lang parameter
            $lang = preg_replace('/[^a-z0-9\-]/', '', $lang);
            $lang_file = __DIR__ . "/langs/{$lang}.php";
            if (!file_exists($lang_file)) {
                $lang_file = __DIR__ . "/langs/en-us.php";
            }
            include $lang_file;
            ?>
            <div style="margin-top: 3rem; border-top: 1px solid var(--color-surface-border); padding-top: 2rem;">
                <a href="../../index.php" class="back-link">← Back to Login</a>
            </div>
        </div>
    </main>

    <script src="../../resources/js/jquery.js"></script>
    <script>
        function switchLanguage(lang) {
            window.location.href = "?lang=" + lang;
        }

        // Sync selector with URL
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang') || 'en-us';
            const select = document.getElementById('privacy-lang-select');
            if (select) select.value = langParam;
        });
    </script>
</body>
</html>
