<?php
class Captcha
{
	public function newCode(){
		$text = $this->random();
		if(isset($_SESSION)){
			$_SESSION['captcha_code'] = $text;
			$_SESSION['refresh_captcha'] = 0;
		}
		return $text;
	}
	public function phpcaptcha($textColor, $backgroundColor, $imgWidth, $imgHeight, $noiceLines = 0, $noiceDots = 0, $noiceColor = '#162453', $text = null)
	{
		header('Content-Type: image/jpeg');
		$text = $text != null ? $text : $this->newCode();
		$font = __DIR__ . '/../resources/font/monofont.ttf';
		$textColorArr = $this->hexToRGB($textColor);
		$backgroundColorArr = $this->hexToRGB($backgroundColor);
		$noiceColorArr = $this->hexToRGB($noiceColor);

		$im = imagecreatetruecolor($imgWidth, $imgHeight);
		$bg = imagecolorallocate($im, $backgroundColorArr['r'], $backgroundColorArr['g'], $backgroundColorArr['b']);
		$tc = imagecolorallocate($im, $textColorArr['r'], $textColorArr['g'], $textColorArr['b']);
		$nc = imagecolorallocate($im, $noiceColorArr['r'], $noiceColorArr['g'], $noiceColorArr['b']);
        
        // Ghost color (very subtle)
        $gc = imagecolorallocate($im, 
            min(255, $backgroundColorArr['r'] + 20), 
            min(255, $backgroundColorArr['g'] + 20), 
            min(255, $backgroundColorArr['b'] + 20)
        );

		imagefill($im, 0, 0, $bg);

        // 1. Ghost Characters (Distractors in background)
        for ($i = 0; $i < 3; $i++) {
            $ghostText = $this->random(1);
            imagettftext($im, $imgHeight * 0.8, mt_rand(-30, 30), mt_rand(0, $imgWidth), mt_rand($imgHeight/2, $imgHeight), $gc, $font, $ghostText);
        }

		// 2. Subtle Noise Dots
		if ($noiceDots > 0) {
			for ($i = 0; $i < $noiceDots; $i++) {
				imagefilledellipse($im, mt_rand(0, $imgWidth), mt_rand(0, $imgHeight), 2, 2, $nc);
			}
		}

		// 3. Subtle Noise Lines (Straight and Curved)
		if ($noiceLines > 0) {
			for ($i = 0; $i < $noiceLines; $i++) {
                if (mt_rand(0, 1)) {
				    imageline($im, mt_rand(0, $imgWidth), mt_rand(0, $imgHeight), mt_rand(0, $imgWidth), mt_rand(0, $imgHeight), $nc);
                } else {
                    imagearc($im, mt_rand(0, $imgWidth), mt_rand(0, $imgHeight), mt_rand(20, 60), mt_rand(20, 60), mt_rand(0, 360), mt_rand(0, 360), $nc);
                }
			}
		}

		// 4. Main Characters with Scaling, Overlap, and Offset
		$length = strlen($text);
		$x = 15;
		for ($i = 0; $i < $length; $i++) {
            $currentFontSize = $imgHeight * (mt_rand(55, 75) / 100);
			$angle = mt_rand(-20, 20);
			$char = substr($text, $i, 1);
			$y = ($imgHeight / 2) + ($currentFontSize / 3) + mt_rand(-8, 8);
			
            imagettftext($im, $currentFontSize, $angle, $x, $y, $tc, $font, $char);
            
			$box = imagettfbbox($currentFontSize, $angle, $font, $char);
			$x += abs($box[2] - $box[0]) - mt_rand(1, 4); // Negative spacing for overlap
		}

		imagejpeg($im, NULL, 90);
		imagedestroy($im);
	}
	protected function random($characters=6,$letters = '1234567890abcdfghjkmnpqrstvwxyz'){
		$str='';
		for ($i=0; $i<$characters; $i++) { 
			$str .= substr($letters, mt_rand(0, strlen($letters)-1), 1);
		}
		return $str;
	}
	protected function hexToRGB($colour)
	{
		if ( $colour[0] == '#' ) {
			$colour = substr( $colour, 1 );
		}
		if ( strlen( $colour ) == 6 ) {
			list( $r, $g, $b ) = array( $colour[0] . $colour[1], $colour[2] . $colour[3], $colour[4] . $colour[5] );
		} elseif ( strlen( $colour ) == 3 ) {
			list( $r, $g, $b ) = array( $colour[0] . $colour[0], $colour[1] . $colour[1], $colour[2] . $colour[2] );
		} else {
			return false;
		}
		$r = hexdec( $r );
		$g = hexdec( $g );
		$b = hexdec( $b );
		return array( 'r' => $r, 'g' => $g, 'b' => $b );
	}
	protected function ImageTTFCenter($image, $text, $font, $size, $angle = 8) 
	{
		$xi = imagesx($image);
		$yi = imagesy($image);
		$box = imagettfbbox($size, $angle, $font, $text);
		$xr = abs(max($box[2], $box[4]))+5;
		$yr = abs(max($box[5], $box[7]));
		$x = intval(($xi - $xr) / 2);
		$y = intval(($yi + $yr) / 2);
		return array($x, $y);   
	}
}
?>