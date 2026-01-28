<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use LiveChat\Chat\ChatHandler;
use LiveChat\Engine\DataStreamEngine;

require __DIR__ . '/../vendor/autoload.php';

date_default_timezone_set('UTC');

// Load Database Config from Social Site
$socialDbConfig = __DIR__ . '/../../includes/config/database.php';
if (!file_exists($socialDbConfig)) {
    die("Social site database configuration not found at: $socialDbConfig\n");
}
require $socialDbConfig;

// Load Security Config
require __DIR__ . '/../../includes/config/auth.php';
require __DIR__ . '/../src/JWT/JWT.php';

// Initialize Custom Engines
$storageDir = __DIR__ . '/../storage/shards';
$msgEngine = new \LiveChat\Engine\ShardedDataStreamEngine($storageDir);

$userStoragePath = __DIR__ . '/../storage/users.json';
$userEngine = new \LiveChat\Engine\UserStorageEngine($userStoragePath);

$mysqlStore = new \LiveChat\Engine\MySQLStore($host, $username, $dbpassword, $db_user);

// Create Server
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new ChatHandler($msgEngine, $userEngine, $mysqlStore)
        )
    ),
    8080 // Port
);

echo "Server running at port 8080...\n";
$server->run();
