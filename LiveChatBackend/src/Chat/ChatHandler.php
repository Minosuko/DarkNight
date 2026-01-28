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
        
        // Default to Binary Protocol (1) for this application
        $this->connProtocol[$conn->resourceId] = 1;

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
                    $this->sendTo($from, ['type' => 'register_success', 'username' => $username, 'userId' => $userId]);
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
                    'userId' => $userId,
                    'social_info' => $socialUser,
                    'payload' => $userVault
                ]);
                $this->connToUser[$from->resourceId] = $username;
                $this->connToId[$from->resourceId] = $userId;
                break;

            case 'message':
                // Check if user is logged in
                if (!isset($this->connToId[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }
                
                $senderID = (int)$this->connToId[$from->resourceId];
                $socialUser = $this->mysql->getInfoById($senderID);
                
                // Restriction: Only Admins (verified >= 20) can broadcast to Global
                if (intval($socialUser['verified'] ?? 0) < 20) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Authorization failed. Only admins can send global messages.']);
                    return;
                }
                
                // Add sender identity to the message for the client
                $outMsgData = [
                    'type' => 'message',
                    'senderID' => $senderID,
                    'recipientID' => 0,
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
                    'senderID' => 0,
                    'recipientID' => 0,
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
                if (!isset($this->connToId[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }
                
                $senderID = (int)$this->connToId[$from->resourceId];
                $recipientID = (int)($data['recipientID'] ?? 0);
                
                if (!$recipientID) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Recipient not specified']);
                    return;
                }

                $outMsgData = [
                    'type' => $data['type'] === 'encrypted_private_message' ? 'encrypted_message' : 'message',
                    'senderID' => $senderID,
                    'recipientID' => $recipientID,
                    'payload' => $data['payload'],
                    'time' => time()
                ];

                // Save to storage (Partitioned by ChatID)
                $binaryPacket = $this->packBinary($outMsgData);
                if ($binaryPacket !== null) {
                    $chatID = $this->getChatID($senderID, $recipientID);
                    $this->db->append($chatID, $binaryPacket);
                }

                // Find recipient AND sender connections
                foreach ($this->clients as $client) {
                    $uid = $this->connToId[$client->resourceId] ?? 0;
                    if ($uid == $recipientID || $uid == $senderID) {
                        $this->sendTo($client, $outMsgData);
                    }
                }
                break;

            case 'attachment':
                if (!isset($this->connToId[$from->resourceId])) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'You must login first']);
                    return;
                }
                
                $senderID = (int)$this->connToId[$from->resourceId];
                $recipientID = (int)($data['recipientID'] ?? 0);
                
                $outMsgData = [
                    'type' => 'attachment',
                    'senderID' => $senderID,
                    'recipientID' => $recipientID,
                    'mediaID' => (int)$data['mediaID'],
                    'mediaHash' => $data['mediaHash'],
                    'time' => time()
                ];

                // Global check
                if ($recipientID === 0) {
                     $socialUser = $this->mysql->getInfoById($senderID);
                     if (intval($socialUser['verified'] ?? 0) < 20) {
                        $this->sendTo($from, ['type' => 'error', 'message' => 'Authorization failed.']);
                        return;
                    }
                }

                $binaryPacket = $this->packBinary($outMsgData);
                if ($binaryPacket !== null) {
                    $chatID = ($recipientID === 0) ? $this->globalStream : $this->getChatID($senderID, $recipientID);
                    $this->db->append($chatID, $binaryPacket);
                }

                foreach ($this->clients as $client) {
                    $uid = $this->connToId[$client->resourceId] ?? 0;
                    if ($recipientID === 0 || $uid == $recipientID || $uid == $senderID) {
                        $this->sendTo($client, $outMsgData);
                    }
                }
                break;

            case 'get_public_key':
                $targetId = (int)($data['userId'] ?? 0);
                if (!$targetId) return;

                $vault = $this->userDb->getUser($targetId);

                if ($vault && isset($vault['publicKey'])) {
                    $this->sendTo($from, [
                        'type' => 'public_key_response',
                        'userId' => $targetId,
                        'publicKey' => $vault['publicKey']
                    ]);
                } else {
                    $this->sendTo($from, ['type' => 'error', 'message' => "Public key for user #$targetId not found."]);
                }
                break;

            case 'load_history':
                $limit = $data['limit'] ?? 20;
                $targetID = (int)($data['targetID'] ?? 0); // 0 or -1 could mean global
                $beforeOffset = $data['beforeOffset'] ?? "";
                
                $senderID = $this->connToId[$from->resourceId] ?? 0;
                if (!$senderID && $targetID > 0) {
                    $this->sendTo($from, ['type' => 'error', 'message' => 'Login required for private history']);
                    return;
                }

                $chatID = ($targetID <= 0) ? $this->globalStream : $this->getChatID($senderID, $targetID);
                $messages = $this->db->fetchLast($chatID, $limit, $beforeOffset);
                
                $this->sendTo($from, [
                    'type' => 'history',
                    'messages' => $messages,
                    'isInitial' => ($beforeOffset === "" || $beforeOffset === -1)
                ]);
                break;

            case 'get_last_messages':
                $targets = $data['targets'] ?? [];
                if (empty($targets)) return;

                $senderID = $this->connToId[$from->resourceId] ?? 0;
                $response = [];

                foreach ($targets as $targetID) {
                    $targetID = (int)$targetID;
                    $chatID = ($targetID <= 0) ? $this->globalStream : ($senderID ? $this->getChatID($senderID, $targetID) : null);
                    if (!$chatID) continue;

                    $last = $this->db->fetchLast($chatID, 1);
                    if (!empty($last)) {
                        $response[$targetID] = $last[0];
                    }
                }

                $this->sendTo($from, [
                    'type' => 'last_messages_response',
                    'data' => $response
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

    private function getChatID(int $u1, int $u2): string {
        $min = min($u1, $u2);
        $max = max($u1, $u2);
        return "p_{$min}_{$max}";
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
        if (strlen($msg) < 1) return null;
        $type = ord(substr($msg, 0, 1));
        
        switch ($type) {
            case 0x01: // Global Message: opcode (1) + senderID (4) + time (4) + payload (N)
                if (strlen($msg) < 9) return null;
                $senderID = unpack('N', substr($msg, 1, 4))[1];
                $time = unpack('N', substr($msg, 5, 4))[1];
                $payload = substr($msg, 9);
                return ['type' => 'message', 'senderID' => $senderID, 'recipientID' => 0, 'time' => $time, 'payload' => $payload];

            case 0x02: // Private Message: opcode (1) + recipientID (4) + senderID (4) + time (4) + payload (N)
                if (strlen($msg) < 13) return null;
                $recipient = unpack('N', substr($msg, 1, 4))[1];
                $sender = unpack('N', substr($msg, 5, 4))[1];
                $time = unpack('N', substr($msg, 9, 4))[1];
                $payload = substr($msg, 13);
                return ['type' => 'message', 'senderID' => $sender, 'recipientID' => $recipient, 'time' => $time, 'payload' => $payload];

            case 0x03: // Login
                return ['type' => 'login', 'token' => substr($msg, 1)];

            case 0x04: // History Request
                if (strlen($msg) < 9) return null;
                $limit = unpack('N', substr($msg, 1, 4))[1];
                $targetID = unpack('N', substr($msg, 5, 4))[1];
                $pointer = substr($msg, 9);
                return ['type' => 'load_history', 'limit' => $limit, 'targetID' => $targetID, 'beforeOffset' => $pointer];

            case 0x0D: // Encrypted Private Message: opcode (1) + recipientID (4) + senderID (4) + time (4) + payload (N)
                if (strlen($msg) < 13) return null;
                $recipient = unpack('N', substr($msg, 1, 4))[1];
                $sender = unpack('N', substr($msg, 5, 4))[1];
                $time = unpack('N', substr($msg, 9, 4))[1];
                $payload = substr($msg, 13);
                return ['type' => 'encrypted_private_message', 'recipientID' => $recipient, 'senderID' => $sender, 'time' => $time, 'payload' => $payload];

            case 0x0F: // Attachment: opcode (1) + recipientID (4) + senderID (4) + time (4) + mediaID (4) + hashLen (1) + hash (N)
                if (strlen($msg) < 18) return null;
                $recipient = unpack('N', substr($msg, 1, 4))[1];
                $sender = unpack('N', substr($msg, 5, 4))[1];
                $time = unpack('N', substr($msg, 9, 4))[1];
                $mediaId = unpack('N', substr($msg, 13, 4))[1];
                $hashLen = ord(substr($msg, 17, 1));
                $hash = substr($msg, 18, $hashLen);
                return ['type' => 'attachment', 'recipientID' => $recipient, 'senderID' => $sender, 'time' => $time, 'mediaID' => $mediaId, 'mediaHash' => $hash];

            case 0x08: // Broadcast Request (Admin)
                return ['type' => 'broadcast', 'payload' => substr($msg, 1)];

            case 0x0B: // Get Public Key
                if (strlen($msg) < 5) return null;
                $targetID = unpack('N', substr($msg, 1, 4))[1];
                return ['type' => 'get_public_key', 'userId' => $targetID];

            case 0x0E: // Get Last Messages (Batch)
                if (strlen($msg) < 5) return null;
                $count = unpack('N', substr($msg, 1, 4))[1];
                $offset = 5;
                $targets = [];
                for ($i = 0; $i < $count; $i++) {
                    if (strlen($msg) < $offset + 4) break;
                    $targets[] = unpack('N', substr($msg, $offset, 4))[1];
                    $offset += 4;
                }
                return ['type' => 'get_last_messages', 'targets' => $targets];
        }
        return null;
    }

    private function packBinary($data) {
        $senderID = (int)($data['senderID'] ?? 0);
        $time = (int)($data['time'] ?? time());
        
        switch ($data['type']) {
            case 'message':
                $recipientID = (int)($data['recipientID'] ?? 0);
                $type = ($recipientID === 0) ? 0x01 : 0x02;
                $packet = chr($type);
                if ($type === 0x02) {
                    $packet .= pack('N', $recipientID);
                }
                $packet .= pack('N', $senderID);
                $packet .= pack('N', $time);
                $packet .= $data['payload'];
                return $packet;
            case 'login_success':
                $json = json_encode([
                    'u' => $data['username'],
                    'id' => $data['userId'],
                    's' => $data['social_info'],
                    'v' => $data['payload']
                ]);
                return chr(0x03) . $json;
            case 'history':
                $packet = chr(0x04) . pack('N', count($data['messages']));
                foreach ($data['messages'] as $msg) {
                    $p = $msg['payload'];
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
                return chr(0x09) . pack('N', $data['userId']) . ($data['username'] ?? '');
            case 'update_vault_success':
                return chr(0x0A);
            case 'public_key_response':
                $targetID = $data['userId'] ?? 0;
                $pk = $data['publicKey'] ?? '';
                return chr(0x0C) . pack('N', $targetID) . pack('N', strlen($pk)) . $pk;
            case 'encrypted_message':
                $packet = chr(0x0D);
                $packet .= pack('N', $data['recipientID']);
                $packet .= pack('N', $senderID);
                $packet .= pack('N', $data['time'] ?? time());
                $packet .= $data['payload'];
                return $packet;
            case 'last_messages_response':
                $packet = chr(0x0E);
                $packet .= pack('N', count($data['data']));
                foreach ($data['data'] as $targetID => $msg) {
                    $packet .= pack('N', (int)$targetID);
                    $p = $msg['payload']; 
                    $packet .= pack('N', strlen($p)) . $p;
                }
                return $packet;
            case 'attachment':
                $packet = chr(0x0F);
                $packet .= pack('N', $data['recipientID'] ?? 0);
                $packet .= pack('N', $senderID);
                $packet .= pack('N', $data['time'] ?? time());
                $packet .= pack('N', (int)$data['mediaID']);
                $hash = $data['mediaHash'] ?? '';
                $packet .= chr(strlen($hash)) . $hash;
                return $packet;
        }
        return null;
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}
