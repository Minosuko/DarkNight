<?php
namespace LiveChat\Engine;

/**
 * UserStorageEngine
 * 
 * Simple JSON Key-Value store for User Identity (Public Keys & Encrypted Private Keys).
 */
class UserStorageEngine {
    private $baseDir;
    private $idxPath;
    private $datPath;
    private $jsonPath;

    public function __construct(string $storagePath) {
        $this->jsonPath = $storagePath;
        $this->baseDir = dirname($storagePath);
        $this->idxPath = $this->baseDir . DIRECTORY_SEPARATOR . "users.idx";
        $this->datPath = $this->baseDir . DIRECTORY_SEPARATOR . "users.dat";

        if (!file_exists($this->baseDir)) {
            mkdir($this->baseDir, 0777, true);
        }

        // Migration from legacy JSON
        if (file_exists($this->jsonPath) && !file_exists($this->idxPath)) {
            $this->migrateFromJson();
        }
    }

    private function migrateFromJson() {
        if (!file_exists($this->jsonPath)) return;
        $json = file_get_contents($this->jsonPath);
        $users = json_decode($json, true) ?? [];
        foreach ($users as $id => $data) {
            $this->saveUser((int)$id, $data);
        }
        rename($this->jsonPath, $this->jsonPath . ".bak");
    }

    public function register($userId, array $data): bool {
        if ($this->getUser($userId) !== null) return false;
        return $this->saveUser($userId, $data);
    }

    public function getUser($userId): ?array {
        if (!file_exists($this->idxPath)) return null;
        $fh = fopen($this->idxPath, 'rb');
        if (!$fh) return null;

        $size = filesize($this->idxPath);
        $records = intval($size / 20);
        $low = 0; $high = $records - 1;
        $found = null;

        while ($low <= $high) {
            $mid = floor(($low + $high) / 2);
            fseek($fh, $mid * 20);
            $raw = fread($fh, 20);
            if (strlen($raw) < 20) break;
            $item = unpack('Jid/Joffset/Nlen', $raw);
            
            if ($item['id'] == $userId) {
                $found = $item;
                break;
            }
            if ($item['id'] < $userId) $low = $mid + 1;
            else $high = $mid - 1;
        }
        fclose($fh);

        if ($found) {
            $dfh = fopen($this->datPath, 'rb');
            if ($dfh) {
                fseek($dfh, $found['offset']);
                $payload = fread($dfh, $found['len']);
                fclose($dfh);
                return $this->unpackVault($payload);
            }
        }
        return null;
    }

    private function packVault(array $data): string {
        $pk = $data['publicKey'] ?? '';
        $salt = $data['salt'] ?? '';
        $iv = $data['iv'] ?? '';
        $ct = $data['ciphertext'] ?? '';

        return pack('CN', 0x01, strlen($pk)) . $pk .
               pack('N', strlen($salt)) . $salt .
               pack('N', strlen($iv)) . $iv .
               pack('N', strlen($ct)) . $ct;
    }

    private function unpackVault(string $binary): ?array {
        if (empty($binary)) return null;
        
        // Detection: JSON starts with '{' (0x7B), My Version is 0x01
        if ($binary[0] === '{') {
            return json_decode($binary, true);
        }

        if (ord($binary[0]) !== 0x01) return null;

        $offset = 1;
        $pkLen = unpack('N', substr($binary, $offset, 4))[1];
        $offset += 4;
        $pk = substr($binary, $offset, $pkLen);
        $offset += $pkLen;

        $saltLen = unpack('N', substr($binary, $offset, 4))[1];
        $offset += 4;
        $salt = substr($binary, $offset, $saltLen);
        $offset += $saltLen;

        $ivLen = unpack('N', substr($binary, $offset, 4))[1];
        $offset += 4;
        $iv = substr($binary, $offset, $ivLen);
        $offset += $ivLen;

        $ctLen = unpack('N', substr($binary, $offset, 4))[1];
        $offset += 4;
        $ct = substr($binary, $offset, $ctLen);

        return [
            'publicKey' => $pk,
            'salt' => $salt,
            'iv' => $iv,
            'ciphertext' => $ct
        ];
    }

    public function update($userId, array $data): bool {
        return $this->saveUser($userId, $data);
    }

    private function saveUser($userId, array $data): bool {
        $payload = $this->packVault($data);
        $len = strlen($payload);

        $fh = fopen($this->datPath, 'ab');
        if (!$fh) return false;
        
        flock($fh, LOCK_EX);
        fseek($fh, 0, SEEK_END);
        $offset = ftell($fh);
        fwrite($fh, $payload);
        fflush($fh);
        flock($fh, LOCK_UN);
        fclose($fh);

        return $this->updateIndex($userId, $offset, $len);
    }

    private function updateIndex($userId, $offset, $len): bool {
        $fh = fopen($this->idxPath, 'c+b');
        if (!$fh) return false;

        flock($fh, LOCK_EX);
        $size = filesize($this->idxPath);
        $records = intval($size / 20);
        $foundPos = -1;

        $low = 0; $high = $records - 1;
        while ($low <= $high) {
            $mid = floor(($low + $high) / 2);
            fseek($fh, $mid * 20);
            $raw = fread($fh, 20);
            if (strlen($raw) < 20) break;
            $item = unpack('Jid/Joffset/Nlen', $raw);
            if ($item['id'] == $userId) {
                $foundPos = $mid;
                break;
            }
            if ($item['id'] < $userId) $low = $mid + 1;
            else $high = $mid - 1;
        }

        if ($foundPos !== -1) {
            fseek($fh, $foundPos * 20);
            fwrite($fh, pack('JJN', $userId, $offset, $len));
        } else {
            // Sorted insertion for binary search
            $insertPos = $low;
            if ($insertPos < $records) {
                for ($i = $records - 1; $i >= $insertPos; $i--) {
                    fseek($fh, $i * 20);
                    $buf = fread($fh, 20);
                    fseek($fh, ($i + 1) * 20);
                    fwrite($fh, $buf);
                }
            }
            fseek($fh, $insertPos * 20);
            fwrite($fh, pack('JJN', $userId, $offset, $len));
        }

        fflush($fh);
        flock($fh, LOCK_UN);
        fclose($fh);
        return true;
    }
}
