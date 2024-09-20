<?php
class LEA {
    private $encrypt;

    public function __construct($EncryptKey, $keyStorePassword) {
        $this->encrypt = base64_decode($EncryptKey);
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

	public function verifyPublicKey($privateKey, $publicKey){
		return $this->privateKeyToPublicKey($privateKey) == $publicKey;
	}

    public function privateKeyToPublicKey($privateKey) {
        if ($privateKey) {
            $key = $this->text2ascii($this->cryptKey(base64_decode($privateKey)));
            $eak = $this->ekey($key);
            $keysize = count($key);
            $cipher = "";
            for ($i = 0; $i < $keysize; $i++) {
                $cipher .= chr($key[$i] ^ $eak);
            }
            return base64_encode($this->cryptKey($cipher));
        } else {
            $this->error('turn private key to public key', 'missing private key');
            return false;
        }
    }

    public function decrypt($text, $privateKey) {
        if ($privateKey) {
            $key = $this->text2ascii($this->cryptKey(base64_decode($privateKey)));
            $eak = $this->ekey($key);
            $text = $this->text2ascii($text);
            $keysize = count($key);
            $textSize = count($text);
            $crypt = "";
            for ($i = 0; $i < $textSize; $i++) {
                $crypt .= chr($text[$i] ^ ($key[$i % $keysize] ^ $eak));
            }
            return $crypt;
        } else {
            $this->error('decrypt', 'missing private key');
            return false;
        }
    }

    public function encrypt($text, $publicKey) {
        if ($publicKey) {
            $key = $this->text2ascii($this->cryptKey(base64_decode($publicKey)));
            $eak = $this->ekey($key);
            $text = $this->text2ascii($text);
            $keysize = count($key);
            $textSize = count($text);
            $cipher = "";
            for ($i = 0; $i < $textSize; $i++) {
                $cipher .= chr($text[$i] ^ $key[$i % $keysize]);
            }
            return $cipher;
        } else {
            $this->error('encrypt', 'missing public key');
            return false;
        }
    }

    public function createPrivateKey($bit = 2048) {
        if (in_array($bit, [512, 1024, 2048, 4096, 8192, 16384])) {
            $key = '';
            $e = 0;
            for ($x = 0; $x < $bit; $x++) {
                $rand = random_int(32, 126);
                $key .= chr($rand);
                $e += $rand;
            }
            return base64_encode($this->cryptKey($key));
        } else {
            $this->error('Create private key', 'invalid bit length');
            return false;
        }
    }

    public function cryptKey($text) {
        $key = $this->text2ascii($this->encrypt);
        $text = $this->text2ascii($text);
        $keysize = count($key);
        $textSize = count($text);
        $cipher = "";
        for ($i = 0; $i < $textSize; $i++) {
            $cipher .= chr($text[$i] ^ $key[$i % $keysize]);
        }
        return $cipher;
    }

    public function text2ascii($text) {
        return array_map('ord', str_split($text));
    }

    public function ekey($ascii) {
        return array_sum($ascii);
    }

    public function error($name, $reason) {
        $err = "<br><b>LEA Error:</b> Could not ${name}, ${reason}.";
        throw new Exception($err);
    }
}
?>