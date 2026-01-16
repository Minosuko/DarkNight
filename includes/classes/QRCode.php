<?php
/**
 * Pure PHP QR Code Generator
 * Implements ISO/IEC 18004 QR Code 2005 standard
 * Supports Version 1-10, Error Correction Level L
 */
class QRCode {
    // Galois Field tables for GF(2^8) with primitive polynomial 0x11D
    private static $EXP = [];
    private static $LOG = [];
    
    // Format information lookup (ECC L, masks 0-7)
    private static $FORMAT_INFO = [
        0 => 0x77C4, 1 => 0x72F3, 2 => 0x7DAA, 3 => 0x789D,
        4 => 0x662F, 5 => 0x6318, 6 => 0x6C41, 7 => 0x6976
    ];
    
    // Version info: [total_codewords, data_codewords_L, ecc_codewords_L, num_blocks_L]
    private static $VERSION_INFO = [
        1  => [26, 19, 7, 1],
        2  => [44, 34, 10, 1],
        3  => [70, 55, 15, 1],
        4  => [100, 80, 20, 1],
        5  => [134, 108, 26, 1],
        6  => [172, 136, 36, 2],
        7  => [196, 156, 40, 2],
        8  => [242, 194, 48, 2],
        9  => [292, 232, 60, 2],
        10 => [346, 274, 72, 4],
    ];
    
    // Alignment pattern center positions per version
    private static $ALIGNMENT = [
        1 => [],
        2 => [18],
        3 => [22],
        4 => [26],
        5 => [30],
        6 => [34],
        7 => [22, 38],
        8 => [24, 42],
        9 => [26, 46],
        10 => [28, 50],
    ];

    private static function initGaloisField() {
        if (!empty(self::$EXP)) return;
        $val = 1;
        for ($i = 0; $i < 255; $i++) {
            self::$EXP[$i] = $val;
            self::$LOG[$val] = $i;
            $val <<= 1;
            if ($val >= 256) $val ^= 0x11D;
        }
        self::$EXP[255] = self::$EXP[0];
    }

    private static function gfMul($a, $b) {
        if ($a === 0 || $b === 0) return 0;
        return self::$EXP[(self::$LOG[$a] + self::$LOG[$b]) % 255];
    }

    private static function gfPow($x, $power) {
        return self::$EXP[(self::$LOG[$x] * $power) % 255];
    }

    private static function computeECC($data, $numEcc) {
        self::initGaloisField();
        
        // Build generator polynomial
        $gen = [1];
        for ($i = 0; $i < $numEcc; $i++) {
            $newGen = array_fill(0, count($gen) + 1, 0);
            $alpha = self::$EXP[$i];
            for ($j = 0; $j < count($gen); $j++) {
                $newGen[$j] ^= $gen[$j];
                $newGen[$j + 1] ^= self::gfMul($gen[$j], $alpha);
            }
            $gen = $newGen;
        }
        
        // Compute remainder
        $result = array_fill(0, $numEcc, 0);
        foreach ($data as $byte) {
            $coef = $byte ^ $result[0];
            array_shift($result);
            $result[] = 0;
            for ($i = 0; $i < $numEcc; $i++) {
                $result[$i] ^= self::gfMul($gen[$i + 1], $coef);
            }
        }
        return $result;
    }

    private static function selectVersion($dataLen) {
        foreach (self::$VERSION_INFO as $v => $info) {
            // Capacity check: 4 bits mode + 8/16 bits count + 8*dataLen bits data
            $countBits = ($v < 10) ? 8 : 16;
            $requiredBits = 4 + $countBits + $dataLen * 8;
            $capacityBits = $info[1] * 8;
            if ($requiredBits <= $capacityBits) return $v;
        }
        return 10;
    }

    private static function encodeData($text, $version) {
        $info = self::$VERSION_INFO[$version];
        $dataCapacity = $info[1];
        
        $bits = '';
        // Mode indicator: Byte mode = 0100
        $bits .= '0100';
        // Character count
        $countBits = ($version < 10) ? 8 : 16;
        $bits .= str_pad(decbin(strlen($text)), $countBits, '0', STR_PAD_LEFT);
        // Data
        for ($i = 0; $i < strlen($text); $i++) {
            $bits .= str_pad(decbin(ord($text[$i])), 8, '0', STR_PAD_LEFT);
        }
        // Terminator
        $remainingBits = $dataCapacity * 8 - strlen($bits);
        $bits .= str_repeat('0', min(4, $remainingBits));
        // Byte alignment
        $bits .= str_repeat('0', (8 - strlen($bits) % 8) % 8);
        
        // Convert to bytes
        $bytes = [];
        for ($i = 0; $i < strlen($bits); $i += 8) {
            $bytes[] = bindec(substr($bits, $i, 8));
        }
        // Padding
        $padPatterns = [0xEC, 0x11];
        $p = 0;
        while (count($bytes) < $dataCapacity) {
            $bytes[] = $padPatterns[$p++ % 2];
        }
        return $bytes;
    }

    private static function buildCodewords($dataBytes, $version) {
        $info = self::$VERSION_INFO[$version];
        $numBlocks = $info[3];
        $eccPerBlock = intval($info[2] / $numBlocks);
        $dataPerBlock = intval($info[1] / $numBlocks);
        $extraData = $info[1] % $numBlocks;
        
        $blocks = [];
        $eccBlocks = [];
        $offset = 0;
        
        for ($b = 0; $b < $numBlocks; $b++) {
            $blockSize = $dataPerBlock + (($b >= $numBlocks - $extraData) ? 1 : 0);
            $block = array_slice($dataBytes, $offset, $blockSize);
            $offset += $blockSize;
            $blocks[] = $block;
            $eccBlocks[] = self::computeECC($block, $eccPerBlock);
        }
        
        // Interleave data blocks
        $result = [];
        $maxBlockSize = $dataPerBlock + ($extraData > 0 ? 1 : 0);
        for ($i = 0; $i < $maxBlockSize; $i++) {
            for ($b = 0; $b < $numBlocks; $b++) {
                if ($i < count($blocks[$b])) {
                    $result[] = $blocks[$b][$i];
                }
            }
        }
        // Interleave ECC blocks
        for ($i = 0; $i < $eccPerBlock; $i++) {
            for ($b = 0; $b < $numBlocks; $b++) {
                $result[] = $eccBlocks[$b][$i];
            }
        }
        return $result;
    }

    private static function createMatrix($version) {
        $size = 17 + $version * 4;
        $m = array_fill(0, $size, array_fill(0, $size, 0));
        $r = array_fill(0, $size, array_fill(0, $size, false)); // reserved
        return [$m, $r, $size];
    }

    private static function setModule(&$m, &$r, $row, $col, $val, $reserve = true) {
        if ($row >= 0 && $row < count($m) && $col >= 0 && $col < count($m)) {
            $m[$row][$col] = $val ? 1 : 0;
            $r[$row][$col] = $reserve;
        }
    }

    private static function drawFinderPattern(&$m, &$r, $cy, $cx) {
        for ($dy = -4; $dy <= 4; $dy++) {
            for ($dx = -4; $dx <= 4; $dx++) {
                $y = $cy + $dy;
                $x = $cx + $dx;
                if ($y >= 0 && $y < count($m) && $x >= 0 && $x < count($m)) {
                    $maxDist = max(abs($dy), abs($dx));
                    $dark = ($maxDist <= 3 && $maxDist != 2);
                    self::setModule($m, $r, $y, $x, $dark);
                }
            }
        }
    }

    private static function drawAlignmentPattern(&$m, &$r, $cy, $cx) {
        for ($dy = -2; $dy <= 2; $dy++) {
            for ($dx = -2; $dx <= 2; $dx++) {
                $dark = (max(abs($dy), abs($dx)) != 1);
                self::setModule($m, $r, $cy + $dy, $cx + $dx, $dark);
            }
        }
    }

    private static function drawTimingPatterns(&$m, &$r, $size) {
        for ($i = 8; $i < $size - 8; $i++) {
            $dark = ($i % 2 == 0);
            self::setModule($m, $r, 6, $i, $dark);
            self::setModule($m, $r, $i, 6, $dark);
        }
    }

    private static function reserveFormatAreas(&$m, &$r, $size) {
        // Around top-left finder
        for ($i = 0; $i < 9; $i++) {
            $r[8][$i] = true;
            $r[$i][8] = true;
        }
        // Around top-right finder
        for ($i = 0; $i < 8; $i++) {
            $r[8][$size - 1 - $i] = true;
        }
        // Around bottom-left finder
        for ($i = 0; $i < 7; $i++) {
            $r[$size - 1 - $i][8] = true;
        }
        // Dark module
        self::setModule($m, $r, $size - 8, 8, true);
    }

    private static function placeData(&$m, &$r, $codewords, $size) {
        $bits = '';
        foreach ($codewords as $cw) {
            $bits .= str_pad(decbin($cw), 8, '0', STR_PAD_LEFT);
        }
        
        $bitIdx = 0;
        $col = $size - 1;
        $upward = true;
        
        while ($col > 0) {
            if ($col == 6) $col--;
            
            for ($row = 0; $row < $size; $row++) {
                $actualRow = $upward ? ($size - 1 - $row) : $row;
                
                for ($c = 0; $c < 2; $c++) {
                    $actualCol = $col - $c;
                    if (!$r[$actualRow][$actualCol]) {
                        $bit = ($bitIdx < strlen($bits)) ? (int)$bits[$bitIdx++] : 0;
                        $m[$actualRow][$actualCol] = $bit;
                    }
                }
            }
            $col -= 2;
            $upward = !$upward;
        }
    }

    private static function applyMask(&$m, &$r, $mask, $size) {
        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                if (!$r[$y][$x]) {
                    $invert = false;
                    switch ($mask) {
                        case 0: $invert = (($y + $x) % 2 == 0); break;
                        case 1: $invert = ($y % 2 == 0); break;
                        case 2: $invert = ($x % 3 == 0); break;
                        case 3: $invert = (($y + $x) % 3 == 0); break;
                        case 4: $invert = ((intdiv($y, 2) + intdiv($x, 3)) % 2 == 0); break;
                        case 5: $invert = (($y * $x) % 2 + ($y * $x) % 3 == 0); break;
                        case 6: $invert = ((($y * $x) % 2 + ($y * $x) % 3) % 2 == 0); break;
                        case 7: $invert = ((($y + $x) % 2 + ($y * $x) % 3) % 2 == 0); break;
                    }
                    if ($invert) $m[$y][$x] ^= 1;
                }
            }
        }
    }

    private static function drawFormatInfo(&$m, $mask, $size) {
        $formatBits = self::$FORMAT_INFO[$mask];
        
        // First copy: around top-left
        for ($i = 0; $i <= 5; $i++) {
            $m[8][$i] = ($formatBits >> $i) & 1;
        }
        $m[8][7] = ($formatBits >> 6) & 1;
        $m[8][8] = ($formatBits >> 7) & 1;
        $m[7][8] = ($formatBits >> 8) & 1;
        for ($i = 9; $i < 15; $i++) {
            $m[14 - $i][8] = ($formatBits >> $i) & 1;
        }
        
        // Second copy: around other finders
        for ($i = 0; $i < 8; $i++) {
            $m[8][$size - 1 - $i] = ($formatBits >> $i) & 1;
        }
        for ($i = 0; $i < 7; $i++) {
            $m[$size - 7 + $i][8] = ($formatBits >> (8 + $i)) & 1;
        }
    }

    public static function render($text, $moduleSize = 5) {
        $version = self::selectVersion(strlen($text));
        $dataBytes = self::encodeData($text, $version);
        $codewords = self::buildCodewords($dataBytes, $version);
        
        list($m, $r, $size) = self::createMatrix($version);
        
        // Draw patterns
        self::drawFinderPattern($m, $r, 3, 3);
        self::drawFinderPattern($m, $r, 3, $size - 4);
        self::drawFinderPattern($m, $r, $size - 4, 3);
        
        // Alignment patterns
        $positions = self::$ALIGNMENT[$version];
        if (!empty($positions)) {
            $allPos = array_merge([6], $positions);
            foreach ($allPos as $cy) {
                foreach ($allPos as $cx) {
                    // Skip if overlaps with finder
                    if (($cy <= 8 && $cx <= 8) || ($cy <= 8 && $cx >= $size - 9) || ($cy >= $size - 9 && $cx <= 8)) {
                        continue;
                    }
                    self::drawAlignmentPattern($m, $r, $cy, $cx);
                }
            }
        }
        
        self::drawTimingPatterns($m, $r, $size);
        self::reserveFormatAreas($m, $r, $size);
        self::placeData($m, $r, $codewords, $size);
        self::applyMask($m, $r, 0, $size);
        self::drawFormatInfo($m, 0, $size);
        
        // Render to image
        $quiet = 4;
        $imgSize = ($size + $quiet * 2) * $moduleSize;
        $img = imagecreatetruecolor($imgSize, $imgSize);
        $white = imagecolorallocate($img, 255, 255, 255);
        $black = imagecolorallocate($img, 0, 0, 0);
        imagefill($img, 0, 0, $white);
        
        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                if ($m[$y][$x] == 1) {
                    $px = ($quiet + $x) * $moduleSize;
                    $py = ($quiet + $y) * $moduleSize;
                    imagefilledrectangle($img, $px, $py, $px + $moduleSize - 1, $py + $moduleSize - 1, $black);
                }
            }
        }
        
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);
        return $png;
    }

    public static function getDataUri($text, $moduleSize = 5) {
        return 'data:image/png;base64,' . base64_encode(self::render($text, $moduleSize));
    }
}
