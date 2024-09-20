// New Base64 En/De-code
var Base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
	, encode: function (input)
	{
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length)
		{
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2))
			{
				enc3 = enc4 = 64;
			}
			else if (isNaN(chr3))
			{
				enc4 = 64;
			}

			output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}
		return output;
	}
	,decode: function (input)
	{
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		while (i < input.length)
		{
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);

			if (enc3 != 64)
			{
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64)
			{
				output = output + String.fromCharCode(chr3);
			}
		}
		output = Base64._utf8_decode(output);
		return output;
	}
	,_utf8_encode: function (string)
	{
		var utftext = "";
		string = string.replace(/\r\n/g, "\n");

		for (var n = 0; n < string.length; n++)
		{
			var c = string.charCodeAt(n);

			if (c < 128)
			{
				utftext += String.fromCharCode(c);
			}
			else if ((c > 127) && (c < 2048))
			{
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else
			{
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}
		return utftext;
	}
	,_utf8_decode: function (utftext)
	{
		var string = "";
		var i = 0;
		var c, c1, c2, c3;
		c = c1 = c2 = 0;

		while (i < utftext.length)
		{
			c = utftext.charCodeAt(i);

			if (c < 128)
			{
				string += String.fromCharCode(c);
				i++;
			}
			else if ((c > 191) && (c < 224))
			{
				c2 = utftext.charCodeAt(i + 1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else
			{
				c2 = utftext.charCodeAt(i + 1);
				c3 = utftext.charCodeAt(i + 2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}
		return string;
	}
}
// Lunar Encryptiom Algorithm
class LEA {
	constructor(debug = 0, EncryptKey) {
		this.debug = debug;
		this.encryptKey = Base64.decode(EncryptKey);
	}

	privateKeyToPublicKey(privateKey) {
		if (privateKey) {
			let key = this.text2ascii(this.cryptKey(Base64.decode(privateKey)));
			let eak = this.ekey(key);
			let keysize = key.length;
			let cipher = "";
			for (let i = 0; i < keysize; i++) {
				cipher += String.fromCharCode(key[i] ^ eak);
			}
			if (this.debug === 1) {
				console.log("\nConverting key to public");
			}
			return Base64.encode(this.cryptKey(cipher));
		} else {
			this.error('turn private key to public key', 'missing private key');
			return false;
		}
	}

	decrypt(text, privateKey) {
		if (privateKey) {
			let key = this.text2ascii(this.cryptKey(Base64.decode(privateKey)));
			let eak = this.ekey(key);
			let textAscii = this.text2ascii(text);
			let keysize = key.length;
			let textSize = textAscii.length;
			let crypt = "";
			for (let i = 0; i < textSize; i++) {
				crypt += String.fromCharCode(textAscii[i] ^ (key[i % keysize] ^ eak));
			}
			if (this.debug === 1) {
				console.log("\nDecrypting");
			}
			return crypt;
		} else {
			this.error('decrypt', 'missing private key');
			return false;
		}
	}

	encrypt(text, publicKey) {
		if (publicKey) {
			let key = this.text2ascii(this.cryptKey(Base64.decode(publicKey)));
			let eak = this.ekey(key);
			let textAscii = this.text2ascii(text);
			let keysize = key.length;
			let textSize = textAscii.length;
			let cipher = "";
			for (let i = 0; i < textSize; i++) {
				cipher += String.fromCharCode(textAscii[i] ^ key[i % keysize]);
			}
			if (this.debug === 1) {
				console.log("\nEncrypting");
			}
			return cipher;
		} else {
			this.error('encrypt', 'missing public key');
			return false;
		}
	}

	createPrivateKey(bit = 2048) {
		if ([512, 1024, 2048, 4096, 8192, 16384].includes(bit)) {
			let key = '';
			let e = 0;
			for (let x = 0; x < bit; x++) {
				let rand = Math.floor(Math.random() * (126 - 32 + 1)) + 32;
				key += String.fromCharCode(rand);
				e += rand;
				if (this.debug === 1 && x % 2 === 0) {
					console.log(rand > 63 ? '+' : '.');
				}
			}
			if (this.debug === 1) {
				console.log("\ngenerate key finished, e is " + e);
			}
			return Base64.encode(this.cryptKey(key));
		} else {
			this.error('Create private key', 'invalid bit length');
			return false;
		}
	}

	cryptKey(text) {
		let key = this.text2ascii(this.encryptKey);
		let textAscii = this.text2ascii(text);
		let keysize = key.length;
		let textSize = textAscii.length;
		let cipher = "";
		for (let i = 0; i < textSize; i++) {
			cipher += String.fromCharCode(textAscii[i] ^ key[i % keysize]);
		}
		if (this.debug === 1) {
			console.log("\nCrypting key");
		}
		return cipher;
	}

	text2ascii(text) {
		return text.split('').map(char => char.charCodeAt(0));
	}

	ekey(ascii) {
		return ascii.reduce((a, b) => a + b, 0);
	}

	error(name, reason) {
		let err = `<br><b>LEA Error:</b> Could not ${name}, ${reason}.`;
		throw new Error(err);
	}
}
if (typeof(Storage) !== "undefined") {
	var EncryptKey = localStorage.getItem("EncryptKey");
	var PublicKey = localStorage.getItem("PublicKey");
	if(EncryptKey == null || PublicKey == null){
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				r = JSON.parse(xhttp.responseText);
				localStorage.setItem("PublicKey",r['PublicKey']);
				localStorage.setItem("EncryptKey",r["EncryptionKey"]);
				location.reload();
			}
		};
		xhttp.open("GET", "worker/getPublicKey.php", true);
		xhttp.send();
	}
	var LunarEncryptiomAlgorithm = new LEA(0,EncryptKey);
}
function encryptPassword(password){
	return Base64.encode(LunarEncryptiomAlgorithm.encrypt(password, PublicKey));
}