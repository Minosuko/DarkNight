<?php
namespace LiveChat\Engine;

/**
 * ShardedDataStreamEngine
 * 
 * Manages multiple binary data shards and provides efficient access across them.
 * Format per shard: [Timestamp (8 bytes)][Payload Length (4 bytes)][Payload (N bytes)] -> Wait, user wanted binary protocol update.
 * Let's stick to the [Length (4)][Payload][Length (4)] for fast bidirectional scanning if needed,
 * but add a shard rotation logic.
 */
class ShardedDataStreamEngine {
    private $baseDir;
    private $shardLimit; // in bytes
    private $currentFileHandle;
    private $currentShardIndex;

    public function __construct(string $baseDir, int $shardLimit = 50000000) { // Default 50MB
        $this->baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR);
        $this->shardLimit = $shardLimit;
        if (!file_exists($this->baseDir)) {
            mkdir($this->baseDir, 0777, true);
        }
    }

    private function getStreamDir(string $stream): string {
        $dir = $this->baseDir . DIRECTORY_SEPARATOR . $stream;
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }
        return $dir;
    }

    private function getShardPath(string $stream, int $index): string {
        return $this->getStreamDir($stream) . DIRECTORY_SEPARATOR . "shard_" . $index . ".bin";
    }

    private function getLastShardIndex(string $stream): int {
        $dir = $this->getStreamDir($stream);
        $files = glob($dir . DIRECTORY_SEPARATOR . "shard_*.bin");
        if (empty($files)) return 0;
        
        $max = 0;
        foreach ($files as $file) {
            if (preg_match('/shard_(\d+)\.bin$/', $file, $matches)) {
                $max = max($max, (int)$matches[1]);
            }
        }
        return $max;
    }

    private function open(string $stream, int $index, string $mode = 'a+b'): bool {
        if (is_resource($this->currentFileHandle)) {
            if ($this->currentShardIndex === $index) return true;
            fclose($this->currentFileHandle);
        }

        $path = $this->getShardPath($stream, $index);
        $this->currentFileHandle = fopen($path, $mode);
        $this->currentShardIndex = $index;
        return is_resource($this->currentFileHandle);
    }

    public function append(string $stream, string $data): string {
        $index = $this->getLastShardIndex($stream);
        $path = $this->getShardPath($stream, $index);
        
        // Rotate shard if limit reached
        if (file_exists($path) && filesize($path) >= $this->shardLimit) {
            $index++;
            $path = $this->getShardPath($stream, $index);
        }

        if ($this->open($stream, $index)) {
            if (flock($this->currentFileHandle, LOCK_EX)) {
                fseek($this->currentFileHandle, 0, SEEK_END);
                $localOffset = ftell($this->currentFileHandle);
                
                $length = strlen($data);
                $packet = pack('N', $length) . $data . pack('N', $length);
                
                fwrite($this->currentFileHandle, $packet);
                fflush($this->currentFileHandle);
                flock($this->currentFileHandle, LOCK_UN);
                
                // Return a global pointer: shardIndex:offset
                return "$index:$localOffset";
            }
        }
        return "";
    }

    public function fetchLast(string $stream, int $limit = 20, string $beforePointer = ""): array {
        $messages = [];
        $shardIndex = $this->getLastShardIndex($stream);
        $localOffset = -1;

        if (!empty($beforePointer)) {
            $parts = explode(':', $beforePointer);
            $shardIndex = (int)$parts[0];
            $localOffset = (int)$parts[1];
        }

        while (count($messages) < $limit && $shardIndex >= 0) {
            $shardPath = $this->getShardPath($stream, $shardIndex);
            if (!file_exists($shardPath)) {
                $shardIndex--;
                $localOffset = -1;
                continue;
            }

            $currentLimit = $limit - count($messages);
            $shardMessages = $this->fetchFromShardBackwards($stream, $shardIndex, $currentLimit, $localOffset);
            
            // Prepend new messages (maintaining chronological order)
            $messages = array_merge($shardMessages, $messages);

            if (count($messages) < $limit) {
                $shardIndex--;
                $localOffset = -1; // Reset to end of previous shard
            }
        }

        return array_slice($messages, -$limit); // Ensure exactly limit if we over-fetched
    }

    private function fetchFromShardBackwards(string $stream, int $index, int $limit, int $beforeOffset): array {
        $path = $this->getShardPath($stream, $index);
        $handle = fopen($path, 'rb');
        if (!$handle) return [];

        $messages = [];
        $currentOffset = ($beforeOffset === -1) ? filesize($path) : $beforeOffset;

        if (flock($handle, LOCK_SH)) {
            for ($i = 0; $i < $limit; $i++) {
                if ($currentOffset < 8) break;
                
                fseek($handle, $currentOffset - 4);
                $trailer = fread($handle, 4);
                if (strlen($trailer) < 4) break;
                $length = unpack('N', $trailer)[1];
                
                $packetStart = $currentOffset - $length - 8;
                if ($packetStart < 0) break;
                
                fseek($handle, $packetStart + 4);
                $payload = fread($handle, $length);
                
                if (strlen($payload) === $length) {
                    $messages[] = [
                        'payload' => $payload,
                        'pointer' => "$index:$packetStart"
                    ];
                }
                
                $currentOffset = $packetStart;
            }
            flock($handle, LOCK_UN);
        }
        fclose($handle);
        return $messages;
    }
}
