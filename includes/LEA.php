<?php
function LEA_init($num) {
	return base_convert($num, 10, 10);
  }
function LEA_add($a, $b) {
	$result = '';
	$carry = 0;
	$a = strrev($a);
	$b = strrev($b);
	$maxLength = max(strlen($a), strlen($b));

	for ($i = 0; $i < $maxLength; $i++) {
		$digitA = isset($a[$i]) ? $a[$i] - '0' : 0;
		$digitB = isset($b[$i]) ? $b[$i] - '0' : 0;
		$sum = $digitA + $digitB + $carry;
		$carry = intdiv($sum, 10);
		$result .= $sum % 10;
	}

	if ($carry) {
		$result .= $carry;
	}

	return strrev($result);
}

function LEA_sub($a, $b) {
	$result = '';
	$carry = 0;
	$a = strrev($a);
	$b = strrev($b);
	$maxLength = max(strlen($a), strlen($b));

	for ($i = 0; $i < $maxLength; $i++) {
		$digitA = isset($a[$i]) ? $a[$i] - '0' : 0;
		$digitB = isset($b[$i]) ? $b[$i] - '0' : 0;
		$diff = $digitA - $digitB - $carry;
		if ($diff < 0) {
			$diff += 10;
			$carry = 1;
		} else {
			$carry = 0;
		}
		$result .= $diff;
	}

	return strrev(ltrim($result, '0'));
}

function LEA_mod($a, $b) {
	$a = strval($a);
	$b = strval($b);
	$remainder = '';

	foreach (str_split($a) as $digit) {
		$remainder = (int)($remainder . $digit) % (int)$b;
	}

	return strval($remainder);
}

function LEA_cmp($a, $b) {
	$a = ltrim($a, '0');
	$b = ltrim($b, '0');
	if (strlen($a) > strlen($b)) return 1;
	if (strlen($a) < strlen($b)) return -1;
	return strcmp($a, $b);
}
function LEA_powm($base, $exponent, $modulus) {
    $result = 1;
    $baseNum = $base;
    $exponentNum = $exponent;
    $modulusNum = $modulus;

    while ($exponentNum > 0) {
        if (($exponentNum & 1) === 1) {
            $result = ($result * $baseNum) % $modulusNum;
        }
        $exponentNum = $exponentNum >> 1;
        $baseNum = ($baseNum * $baseNum) % $modulusNum;
    }
    return (string)$result;
}
function LEA_mul($a, $b) {
	$result = '0';
	$a = strrev($a);
	for ($i = 0; $i < strlen($a); $i++) {
		$temp = str_repeat('0', $i);
		$carry = 0;
		for ($j = 0; $j < strlen($b); $j++) {
			$digitA = $a[$i] - '0';
			$digitB = $b[$j] - '0';
			$product = $digitA * $digitB + $carry;
			$carry = intdiv($product, 10);
			$temp .= $product % 10;
		}
		if ($carry) $temp .= $carry;
		$result = LEA_add($result, strrev($temp));
	}
	return $result;
}

function LEA_invert($a, $b) {
	$x = 0;
	$y = 1;
	$last_x = 1;
	$last_y = 0;
	$orig_b = $b;

	while ($b != 0) {
		$quotient = intdiv($a, $b);
		list($a, $b) = [$b, $a % $b];
		list($last_x, $x) = [$x, $last_x - $quotient * $x];
		list($last_y, $y) = [$y, $last_y - $quotient * $y];
	}

	if ($a > 1) return false;
	if ($last_x < 0) $last_x += $orig_b;

	return $last_x;
}

function LEA_random_bits($n_bits) {
	if ($n_bits <= 0) {
		throw new InvalidArgumentException("Number of bits must be a positive integer.");
	}

	$max_value = (1 << $n_bits) - 1;
	return strval(random_int(0, $max_value));
}
class LEA {
	public function __construct($keyStorePassword) {
		$this->storepass = base64_decode($keyStorePassword);
	}

	public function storePrivateKey($id, $key){
		$store = __DIR__ . '/../data/key/';
		$key = file_put_contents($store.md5($id).'.key', $this->cryptStoreKey($key));
		return true;
	}

	public function getPrivateKey($id){
		$store = __DIR__ . '/../data/key/';
		if(file_exists($store.md5($id).'.key')){
			$key = file_get_contents($store.md5($id).'.key');
			return $this->cryptStoreKey($key);
		} else {
			$this->error('get private key', 'key not found');
			return false;
		}
	}

	public function PrivateKeyExists($id){
		$store = __DIR__ . '/../data/key/';
		return file_exists($store.md5($id).'.key');
	}

	public function cryptStoreKey($text) {
		$key = $this->text2ascii($this->storepass);
		$text = $this->text2ascii($text);
		$keysize = count($key);
		$textSize = count($text);
		$cipher = "";
		for ($i = 0; $i < $textSize; $i++) {
			$cipher .= chr($text[$i] ^ $key[$i % $keysize]);
		}
		return $cipher;
	}
	private function is_prime($num) {
		if ($num <= 1) return false;
		if ($num <= 3) return true;
		if ($num % 2 == 0 || $num % 3 == 0) return false;
	
		for ($i = 5; $i * $i <= $num; $i += 6) {
			if ($num % $i == 0 || $num % ($i + 2) == 0) return false;
		}
		return true;
	}
	private function generate_prime($bits) {
		do {
			$num = LEA_random_bits($bits);
		} while (!$this->is_prime($num));
		return $num;
	}
	private function gcd($a, $b) {
		while (LEA_cmp($b, 0) != 0) {
			$temp = $b;
			$b = LEA_mod($a, $b);
			$a = $temp;
		}
		return $a;
	}
	public function privateKeyToPublicKey($prikey){
		$decode = base64_decode($prikey);
		$e = LEA_init(65537);
		return base64_encode(pack('i',$e).substr($decode,4,4));
	}
	public function generate_key(){
		$p = $this->generate_prime(8);
		$q = $this->generate_prime(8);
		$n = LEA_mul($p, $q);
		$phi = LEA_mul(LEA_sub($p, 1), LEA_sub($q, 1));
		
		$e = LEA_init(65537);
		while (LEA_cmp($this->gcd($e, $phi), 1) != 0) {
			$e = LEA_add($e, 2);
		}
		$d = LEA_invert($e, $phi);
		return [
			'private' => base64_encode(pack('i',$d).pack('i',$n).pack('i',$p).pack('i',$q)),
			'public' => base64_encode(pack('i',$e).pack('i',$n)),
		];
	}
	public function encrypt($str, $pubkey){
		$str = $this->text2dec($str);
		$decode = base64_decode($pubkey);
		$e = unpack('i',substr($decode,0,4))[1];
		$n = unpack('i',substr($decode,4,4))[1];
		for($i = 0; $i < count($str); $i++){
			$str[$i] = $this->encrypt_char($str[$i], $e, $n);
		}
		return $this->ascii2text($str);
	}
	public function decrypt($str, $prikey){
		$str = $this->text2ascii($str);
		$decode = base64_decode($prikey);
		$d = unpack('i',substr($decode,0,4))[1];
		$n = unpack('i',substr($decode,4,4))[1];
		for($i = 0; $i < count($str); $i++){
			$str[$i] = $this->decrypt_char($str[$i], $d, $n);
		}
		return $this->dec2text($str);
	}

	private function encrypt_char($message, $e, $n) {
		$message = LEA_init($message);
		return LEA_powm($message, $e, $n);
	}
	
	private function decrypt_char($encrypted, $d, $n) {
		return LEA_powm($encrypted, $d, $n);
	}
	private function text2dec($text) {
		$text = bin2hex($text);
		$str = str_split($text);
		for($i = 0; $i < count($str); $i++){
			$str[$i] = hexdec(bin2hex($i));
		}
		return implode('', $str);
	}
	private function dec2text($dec) {
		$text = "";
		foreach($dec as $char) {
			$text .= dechex($char);
		}
		return hex2bin(hex2bin($text));
	}
    private function text2ascii($text) {
        return array_map('ord', str_split($text));
    }
    private function ascii2text($ascii) {
        return implode('',array_map('chr', $ascii));
    }
}
?>