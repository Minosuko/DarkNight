<?php
namespace LiveChat\Chat;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use LiveChat\Engine\ShardedDataStreamEngine;

use LiveChat\Engine\UserStorageEngine;
use Ratchet\RFC6455\Messaging\Frame;

class ChatHandler implements MessageComponentInterface {
    protected $clients;
    protected $db;
    protected $userDb;
    protected $mysql;
    protected $globalStream = 'global';

    // Map Connection -> Username (for identification)
    protected $connToUser = [];

    // Map Connection -> UserId (for vault operations)
    protected $connToId = [];

    // Map resourceId -> Protocol Type (0 = JSON, 1 = Binary)
    protected $connProtocol = [];

    // Map resourceId -> Assigned Pretty Number (reusable)
    protected $activeNums = [];

    public function __construct(ShardedDataStreamEngine $db, UserStorageEngine $userDb, \LiveChat\Engine\MySQLStore $mysql) {
        $this->clients = new \SplObjectStorage;
        $this->db = $db;
        $this->userDb = $userDb;
        $this->mysql = $mysql;
        echo "Chat Server Initialized with MySQL Support!\n";
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        
        // Find smallest available number starting from 1
        $num = 1;
        while (in_array($num, $this->activeNums)) {
            $num++;
        }
        $this->activeNums[$conn->resourceId] = $num;

        echo "New connection! ($num)\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $msgStr = (string)$msg;
        $firstByte = substr($msgStr, 0, 1);

        // Detect/Sticky protocol
        if (!isset($this->connProtocol[$from->resourceId])) {
            // Binary opcodes are 0x01-0x0A, JSON starts with { or [
            $this->connProtocol[$from->resourceId] = (ord($firstByte) < 32 && $firstByte !== '[') ? 1 : 0;
        }

        if ($this->connProtocol[$from->resourceId] === 1) {
            $data = $this->unpackBinary($msgStr);
        } else {
            $data = json_decode($msgStr, true);
        }

        if (!$data || !isset($data['type'])) return;

        switch ($data['type']) {
            case 'register':
                $token = $data['token'] ?? '';
                $payload = $data['payload'] ?? []; // Encrypted keys + salt
                
                if (empty($token) || empty($payload)) return;

                $decoded = \JWT::decode($token);
                if (!$decoded || !isset($decoded['user_id'])) {
                    echo "Register: JWT Decode Failed or user_id missing\n";
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Invalid or expired social session.']);
                    return;
                }

                $userId = $decoded['user_id'];
                $socialUser = $this->mysql->getInfoById($userId);

                if (!$socialUser) {
                    echo "Register: Social account not found for ID: $userId\n";
                    $from->send(json_encode(['type' => 'error', 'message' => 'Social account not found. Register at DarkNight first.']));
                    return;
                }

                $username = $socialUser['user_nickname'] ?? null;
                echo "Register: Found user $username for ID $userId\n";

                if ($this->userDb->register($userId, $payload)) {
                    $this->sendTo($from, ['type' => 'register_success', 'username' => $username]);
                    $this->connToUser[$from->resourceId] = $username;
                    $this->connToId[$from->resourceId] = $userId;
                    echo "E2E Identity Linked for Social User: $username (ID: $userId)\n";
                } else {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Chat identity already exists for this account.']);
                }
                break;

            case 'login':
                $token = $data['token'] ?? '';
                if (empty($token)) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Token missing']);
                    return;
                }

                $payload = \JWT::decode($token);
                if (!$payload) {
                    echo "Login: JWT Decode Failed\n";
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Invalid or expired token']);
                    return;
                }
                if (!isset($payload['user_id'])) {
                    echo "Login: JWT Payload missing user_id\n";
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Invalid token payload']);
                    return;
                }

                $userId = $payload['user_id'];
                
                // 1. Get Social Meta
                $socialUser = $this->mysql->getInfoById($userId);
                if (!$socialUser) {
                    echo "Login: Social account not found for ID: $userId\n";
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Social account not found.']);
                    return;
                }

                $username = strtolower($socialUser['user_nickname'] ?? "");
                echo "Login: Found user $username (normalized) for ID $userId\n";

                // 2. Get E2E Vault by UserID
                $userVault = $this->userDb->getUser($userId);
                
                $this->sendTo($from, [
                    'type' => 'login_success', 
                    'username' => $username,
                    'social_info' => $socialUser,
                    'payload' => $userVault
                ]);
                $this->connToUser[$from->resourceId] = $username;
                $this->connToId[$from->resourceId] = $userId;
                break;

            case 'message':
                // Check if user is logged in
                if (!isset($this->connToUser[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }
                
                $sender = $this->connToUser[$from->resourceId];
                $socialUser = $this->mysql->getUserInfo($sender);
                
                // Restriction: Only Admins (verified >= 20) can broadcast to Global
                if (intval($socialUser['verified'] ?? 0) < 20) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Global Broadcast is read-only. Only Admins can send messages here.']);
                    return;
                }
                
                // Add sender identity to the message for the client
                $outMsgData = [
                    'type' => 'message',
                    'sender' => $sender,
                    'payload' => $data['payload'],
                    'time' => time()
                ];

                // Save to sharded storage (Global Stream)
                $binaryPacket = $this->packBinary($outMsgData);
                if ($binaryPacket !== null) {
                    $this->db->append($this->globalStream, $binaryPacket);
                }

                // Broadcast
                foreach ($this->clients as $client) {
                    $this->sendTo($client, $outMsgData);
                }
                break;

            case 'broadcast':
                // Check if user is logged in
                if (!isset($this->connToUser[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }

                $sender = $this->connToUser[$from->resourceId];
                $socialUser = $this->mysql->getUserInfo($sender);

                // Strict Admin Check (verified >= 20)
                if (intval($socialUser['verified'] ?? 0) < 20) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Permission denied.']);
                    return;
                }

                $payload = $data['payload'] ?? '';
                if (empty($payload)) return;

                // Build message for storage and broadcast
                $outMsgData = [
                    'type' => 'system',
                    'sender' => 'SYSTEM',
                    'payload' => $payload,
                    'time' => time()
                ];

                // Save to chat log (sharded - Global)
                $binaryPacket = $this->packBinary($outMsgData);
                if ($binaryPacket !== null) {
                    $this->db->append($this->globalStream, $binaryPacket);
                }

                // Broadcast to all connected clients
                foreach ($this->clients as $client) {
                    $this->sendTo($client, $outMsgData);
                }
                break;

            case 'private_message':
            case 'encrypted_private_message':
                // Check if user is logged in
                if (!isset($this->connToUser[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }
                
                $sender = $this->connToUser[$from->resourceId];
                $recipient = $data['recipient'] ?? '';
                
                if (empty($recipient)) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Recipient not specified']);
                    return;
                }

                $outMsgData = [
                    'type' => $data['type'] === 'encrypted_private_message' ? 'encrypted_message' : 'message',
                    'sender' => $sender,
                    'recipient' => $recipient,
                    'payload' => $data['payload'],
                    'time' => time()
                ];

                // Save to storage (Partitioned by ChatID)
                $binaryPacket = $this->packBinary($outMsgData);
                if ($binaryPacket !== null) {
                    $chatID = $this->getChatID($sender, $recipient);
                    $this->db->append($chatID, $binaryPacket);
                }

                // Find recipient AND sender connections
                foreach ($this->clients as $client) {
                    $u = $this->connToUser[$client->resourceId] ?? null;
                    if ($u === $recipient || $u === $sender) {
                        $this->sendTo($client, $outMsgData);
                    }
                }
                break;

            case 'get_public_key':
                $username = strtolower($data['username'] ?? '');
                if (empty($username)) return;

                // Resolve username to ID
                $targetUser = $this->mysql->getUserInfo($username);
                if (!$targetUser) {
                    $this->sendTo($from, ['type' => 'error', 'message' => "User $username not found."]);
                    return;
                }

                $targetId = $targetUser['user_id'];
                $vault = $this->userDb->getUser($targetId);

                if ($vault && isset($vault['publicKey'])) {
                    $this->sendTo($from, [
                        'type' => 'public_key_response',
                        'username' => $username,
                        'publicKey' => $vault['publicKey']
                    ]);
                } else {
                    $this->sendTo($from, ['type' => 'error', 'message' => "Public key for $username not found."]);
                }
                break;

            case 'load_history':
                $limit = $data['limit'] ?? 20;
                $target = $data['target'] ?? 'global';
                $beforeOffset = $data['beforeOffset'] ?? "";
                
                $sender = $this->connToUser[$from->resourceId] ?? null;
                if (!$sender && $target !== 'global') {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Login required for private history']);
                    return;
                }

                $chatID = ($target === 'global') ? $this->globalStream : $this->getChatID($sender, $target);
                $messages = $this->db->fetchLast($chatID, $limit, $beforeOffset);
                
                $this->sendTo($from, [
                    'type' => 'history',
                    'messages' => $messages,
                    'isInitial' => ($beforeOffset === "" || $beforeOffset === -1)
                ]);
                break;
                
            case 'update_vault':
                // Check if user is logged in
                if (!isset($this->connToId[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }
                
                $userId = $this->connToId[$from->resourceId];
                $username = $this->connToUser[$from->resourceId] ?? 'Unknown';
                $payload = $data['payload'] ?? [];
                
                if (empty($payload)) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Empty payload']);
                    return;
                }

                if ($this->userDb->update($userId, $payload)) {
                    $this->sendTo($from, ['type' => 'update_vault_success']);
                    echo "E2E Identity Updated for User: $username (ID: $userId)\n";
                } else {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Vault update failed']);
                }
                break;

            case 'handshake':
                break;
        }
    }

    private function sendTo($conn, $data) {
        $protocol = $this->connProtocol[$conn->resourceId] ?? 0;
        if ($protocol === 1) {
            $packet = $this->packBinary($data);
            if ($packet) $conn->send(new Frame($packet, true, Frame::OP_BINARY));
        } else {
            $conn->send(json_encode($data));
        }
    }
    
    private function broadcastSystem($msg) {
        $data = ['type' => 'system', 'payload' => $msg, 'time' => time()];
        foreach ($this->clients as $client) {
             $this->sendTo($client, $data);
        }
    }

    private function getChatID(string $u1, string $u2): string {
        $users = [strtolower($u1), strtolower($u2)];
        sort($users);
        return 'p_' . implode('_', $users);
    }

    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);
        
        $num = $this->activeNums[$conn->resourceId] ?? $conn->resourceId;
        unset($this->activeNums[$conn->resourceId]);
        unset($this->connToUser[$conn->resourceId]);
        unset($this->connToId[$conn->resourceId]);

        echo "Connection $num has disconnected\n";
    }

    private function unpackBinary($msg) {
        $type = ord(substr($msg, 0, 1));
        switch ($type) {
            case 0x01: // Message (Global)
                return ['type' => 'message', 'payload' => substr($msg, 1)];
            case 0x02: // Private Message
                $recipientLen = ord(substr($msg, 1, 1));
                $recipient = substr($msg, 2, $recipientLen);
                $payload = substr($msg, 2 + $recipientLen);
                return ['type' => 'private_message', 'recipient' => $recipient, 'payload' => $payload];
            case 0x03: // Login
                return ['type' => 'login', 'token' => substr($msg, 1)];
            case 0x04: // History Request
                $limit = unpack('N', substr($msg, 1, 4))[1];
                $tLen = ord(substr($msg, 5, 1));
                $target = substr($msg, 6, $tLen);
                $pointer = substr($msg, 6 + $tLen);
                return ['type' => 'load_history', 'limit' => $limit, 'target' => $target, 'beforeOffset' => $pointer];
            case 0x05: // Register
                $rawJson = substr($msg, 1);
                $json = json_decode($rawJson, true);
                if (!$json || !isset($json['t']) || !isset($json['p'])) {
                    echo "Register: Malformed binary payload. Keys missing. Raw: " . substr($rawJson, 0, 50) . "...\n";
                    return ['type' => 'register', 'token' => null, 'payload' => null];
                }
                return ['type' => 'register', 'token' => $json['t'], 'payload' => $json['p']];
            case 0x06: // Update Vault
                $json = json_decode(substr($msg, 1), true);
                return ['type' => 'update_vault', 'payload' => $json];
            case 0x08: // Broadcast Request (Admin)
                return ['type' => 'broadcast', 'payload' => substr($msg, 1)];
            case 0x0B: // Get Public Key
                $uLen = ord(substr($msg, 1, 1));
                $target = substr($msg, 2, $uLen);
                return ['type' => 'get_public_key', 'username' => $target];
            case 0x0D: // Encrypted Private Message
                $recipientLen = ord(substr($msg, 1, 1));
                $recipient = substr($msg, 2, $recipientLen);
                $payload = substr($msg, 2 + $recipientLen);
                return ['type' => 'encrypted_private_message', 'recipient' => $recipient, 'payload' => $payload];
        }
        return null;
    }

    private function packBinary($data) {
        switch ($data['type']) {
            case 'message':
                $sender = $data['sender'] ?? '';
                $type = isset($data['recipient']) ? 0x02 : 0x01;
                $packet = chr($type);
                if ($type === 0x02) {
                    $packet .= chr(strlen($data['recipient'])) . $data['recipient'];
                }
                $packet .= chr(strlen($sender)) . $sender;
                $packet .= pack('N', $data['time'] ?? time());
                $packet .= $data['payload'];
                return $packet;
            case 'login_success':
                $json = json_encode([
                    'u' => $data['username'],
                    's' => $data['social_info'],
                    'v' => $data['payload']
                ]);
                return chr(0x03) . $json;
            case 'history':
                $packet = chr(0x04) . pack('N', count($data['messages']));
                foreach ($data['messages'] as $msg) {
                    $p = $msg['payload']; // This is already binary if stored as such
                    $packet .= pack('N', strlen($p)) . $p;
                    $packet .= chr(strlen($msg['pointer'])) . $msg['pointer'];
                }
                $packet .= chr($data['isInitial'] ? 1 : 0);
                return $packet;
            case 'error':
                return chr(0x05) . ($data['message'] ?? 'Unknown Error');
            case 'system':
                $packet = chr(0x07);
                $packet .= pack('N', $data['time'] ?? time());
                $packet .= $data['payload'];
                return $packet;
            case 'register_success':
                return chr(0x09) . ($data['username'] ?? '');
            case 'update_vault_success':
                return chr(0x0A);
            case 'public_key_response':
                $username = $data['username'] ?? '';
                $pk = $data['publicKey'] ?? '';
                return chr(0x0C) . chr(strlen($username)) . $username . pack('N', strlen($pk)) . $pk;
            case 'encrypted_message':
                $sender = $data['sender'] ?? '';
                $packet = chr(0x0D);
                $packet .= chr(strlen($data['recipient'])) . $data['recipient'];
                $packet .= chr(strlen($sender)) . $sender;
                $packet .= pack('N', $data['time'] ?? time());
                $packet .= $data['payload'];
                return $packet;
        }
        return null;
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}
