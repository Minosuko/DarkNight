<?php
/**
 * IP2Location Binary Database Reader (Lite Version)
 * Based on the official IP2Location PHP implementation but simplified.
 */
class IP2LocationReader {
    private $dbFile;
    private $handle;
    private $databaseType;
    private $databaseColumn;
    private $databaseDay;
    private $databaseMonth;
    private $databaseYear;
    private $databaseCount;
    private $databaseAddress;
    private $ipVersion;

    const COUNTRY_POSITION = [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    const REGION_POSITION = [0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    const CITY_POSITION = [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    const TIMEZONE_POSITION = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11];

    public function __construct($dbFile) {
        $this->dbFile = $dbFile;
        if (!file_exists($dbFile)) {
            throw new Exception("Database file not found: $dbFile");
        }
        $this->handle = fopen($dbFile, 'rb');
        $this->readHeader();
    }

    private function readHeader() {
        fseek($this->handle, 0);
        $data = fread($this->handle, 64);
        $header = unpack('Ctype/Ccolumn/Cday/Cmonth/Cyear/Lcount/Laddress/Lcount_v6/Laddress_v6', $data);
        
        $this->databaseType = $header['type'];
        $this->databaseColumn = $header['column'];
        $this->databaseDay = $header['day'];
        $this->databaseMonth = $header['month'];
        $this->databaseYear = $header['year'];
        $this->databaseCount = $header['count'];
        $this->databaseAddress = $header['address'];
    }

    public function lookup($ip) {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $ipNum = sprintf('%u', ip2long($ip));
            return $this->search($ipNum, 4);
        }
        // IPv6 support could be added here if needed
        return false;
    }

    private function search($ipNum, $version) {
        $low = 0;
        $high = $this->databaseCount;
        $baseAddr = $this->databaseAddress;
        $columnSize = $this->databaseColumn * 4;

        while ($low <= $high) {
            $mid = (int)(($low + $high) / 2);
            fseek($this->handle, $baseAddr + ($mid * ($columnSize + 4)));
            $ipFrom = unpack('L', fread($this->handle, 4))[1];
            fseek($this->handle, $baseAddr + (($mid + 1) * ($columnSize + 4)));
            $ipTo = unpack('L', fread($this->handle, 4))[1];

            if ($ipNum >= $ipFrom && $ipNum < $ipTo) {
                return $this->readRecord($baseAddr + ($mid * ($columnSize + 4)) + 4);
            } else {
                if ($ipNum < $ipFrom) {
                    $high = $mid - 1;
                } else {
                    $low = $mid + 1;
                }
            }
        }
        return false;
    }

    private function readRecord($pos) {
        $result = [];
        
        // Read Country
        if (self::COUNTRY_POSITION[$this->databaseType] > 0) {
            $result['country_code'] = $this->readString($pos + (self::COUNTRY_POSITION[$this->databaseType] - 2) * 4);
            $result['country_name'] = $this->readString($pos + (self::COUNTRY_POSITION[$this->databaseType] - 2) * 4 + 4);
        }
        
        // Read Region
        if (self::REGION_POSITION[$this->databaseType] > 0) {
            $result['region'] = $this->readString($pos + (self::REGION_POSITION[$this->databaseType] - 2) * 4);
        }
        
        // Read City
        if (self::CITY_POSITION[$this->databaseType] > 0) {
            $result['city'] = $this->readString($pos + (self::CITY_POSITION[$this->databaseType] - 2) * 4);
        }

        // Read Timezone
        if (self::TIMEZONE_POSITION[$this->databaseType] > 0) {
             $result['timezone'] = $this->readString($pos + (self::TIMEZONE_POSITION[$this->databaseType] - 2) * 4);
        }

        return $result;
    }

    private function readString($pos) {
        fseek($this->handle, $pos);
        $offset = unpack('L', fread($this->handle, 4))[1];
        fseek($this->handle, $offset);
        $len = unpack('C', fread($this->handle, 1))[1];
        return fread($this->handle, $len);
    }

    public function __destruct() {
        if ($this->handle) {
            fclose($this->handle);
        }
    }
}
