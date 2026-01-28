<?php
namespace LiveChat\Engine;

/**
 * DataStreamEngine
 * 
 * A high-performance, append-only file storage engine.
 * It bypasses standard SQL overhead by writing binary packets directly to disk.
 * 
 * Format:
 * [Timestamp (8 bytes)][Payload Length (4 bytes)][Payload (N bytes)]
 */
class DataStreamEngine {
    private $storageFile;
    private $fileHandle;

    public function __construct(string $storagePath) {
        $this->storageFile = $storagePath;
        if (!file_exists(dirname($storagePath))) {
            mkdir(dirname($storagePath), 0777, true);
        }
    }

    private function open() {
        if (!is_resource($this->fileHandle)) {
            $this->fileHandle = fopen($this->storageFile, 'a+b');
        }
    }

    /**
     * Appends a message to the storage file.
     * 
     * Format: [Len (4)][Data][Len (4)]
     */
    public function append(string $data): int {
        $this->open();
        
        if (flock($this->fileHandle, LOCK_EX)) {
            fseek($this->fileHandle, 0, SEEK_END);
            $offset = ftell($this->fileHandle);
            
            $length = strlen($data);
            $packet = pack('N', $length) . $data . pack('N', $length);
            
            fwrite($this->fileHandle, $packet);
            fflush($this->fileHandle);
            flock($this->fileHandle, LOCK_UN);
            
            return $offset;
        }
        
        return -1;
    }

    /**
     * Reads messages backwards from a specific offset.
     * 
     * @param int $limit Max number of messages
     * @param int $beforeOffset Offset to start scanning backwards from (-1 for end)
     * @return array
     */
    public function fetchLast(int $limit = 20, int $beforeOffset = -1): array {
        $this->open();
        $messages = [];
        
        if (flock($this->fileHandle, LOCK_SH)) {
            $currentOffset = ($beforeOffset === -1) ? $this->getTip() : $beforeOffset;
            
            for ($i = 0; $i < $limit; $i++) {
                if ($currentOffset < 8) break;
                
                // Read trailing length
                fseek($this->fileHandle, $currentOffset - 4);
                $trailer = fread($this->fileHandle, 4);
                if (strlen($trailer) < 4) break;
                $length = unpack('N', $trailer)[1];
                
                // Packet starts 4 bytes (leading len) + payload + 4 bytes (trailing len) before currentOffset
                $packetStart = $currentOffset - $length - 8;
                if ($packetStart < 0) break;
                
                // Seek to data payload (skip leading 4 byte len)
                fseek($this->fileHandle, $packetStart + 4);
                $payload = fread($this->fileHandle, $length);
                
                if (strlen($payload) === $length) {
                    // Prepend to maintain chronological order in the chunk
                    array_unshift($messages, [
                        'payload' => $payload,
                        'offset' => $packetStart
                    ]);
                }
                
                $currentOffset = $packetStart;
            }
            
            flock($this->fileHandle, LOCK_UN);
        }
        
        return $messages;
    }

     /**
     * Gets the current file size (total offset).
     */
    public function getTip(): int {
        if (!file_exists($this->storageFile)) return 0;
        return filesize($this->storageFile);
    }
}
