<?php
// Secret key for JWT signing. 
// In production, this should be a complex random string loaded from env vars or secure vault.
define('JWT_SECRET', 'YourRemoteSecretKeyForDarkNightSocialApp2026!');
define('JWT_ALGO', 'HS256');
define('JWT_EXP', 86400 * 30); // 30 Days expiration to match previous "remember me" logic roughly
?>
