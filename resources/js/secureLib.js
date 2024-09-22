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
function init(num) {
	if (typeof num === 'string') {
		if (num.startsWith('0x')) {
			return BigInt(parseInt(num.substring(2), 16));
		} else if (num.startsWith('0b')) {
			return BigInt(parseInt(num.substring(2), 2));
		} else {
			return BigInt(parseInt(num, 10));
		}
	} else {
		return BigInt(num);
	}
}
function bcpowmod(base, exponent, modulus) {
	let result = 1n;
	let baseNum = BigInt(base);
	let exponentNum = BigInt(exponent);
	let modulusNum = BigInt(modulus);
	
	while (exponentNum > 0n) {
		if ((exponentNum & 1n) === 1n) {
			result = (result * baseNum) % modulusNum;
		}
		exponentNum = exponentNum >> 1n;
		baseNum = (baseNum * baseNum) % modulusNum;
	}
	return result.toString();
}
function unpack(format, data) {
	var formatPointer = 0, dataPointer = 0, result = {}, instruction = '',
		quantifier = '', label = '', currentData = '', i = 0, j = 0,
		word = '', fbits = 0, ebits = 0, dataByteLength = 0;
	var fromIEEE754 = function(bytes, ebits, fbits) {
		var bits = [];
		for (var i = bytes.length; i; i -= 1) {
			var byte = bytes[i - 1];
			for (var j = 8; j; j -= 1) {
				bits.push(byte % 2 ? 1 : 0); byte = byte >> 1;
			}
		}
		bits.reverse();
		var str = bits.join('');
		var bias = (1 << (ebits - 1)) - 1;
		var s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
		var e = parseInt(str.substring(1, 1 + ebits), 2);
		var f = parseInt(str.substring(1 + ebits), 2);
		if (e === (1 << ebits) - 1) {
			return f !== 0 ? NaN : s * Infinity;
		}
		else if (e > 0) {
			return s * Math.pow(2, e - bias) * (1 + f / Math.pow(2, fbits));
		}
		else if (f !== 0) {
			return s * Math.pow(2, -(bias-1)) * (f / Math.pow(2, fbits));
		}
		else {
			return s * 0;
		}
	}
	while (formatPointer < format.length) {
		instruction = format.charAt(formatPointer);
		quantifier = '';
		formatPointer++;
		while ((formatPointer < format.length) && (format.charAt(formatPointer).match(/[\d\*]/) !== null)) {
			quantifier += format.charAt(formatPointer);
			formatPointer++;
		}
		if (quantifier === '') {
			quantifier = '1';
		}
		label = '';
		while ((formatPointer < format.length) && (format.charAt(formatPointer) !== '/')) {
			label += format.charAt(formatPointer);
			formatPointer++;
		}
		if (format.charAt(formatPointer) === '/') {
			formatPointer++;
		}
		switch (instruction) {
		case 'a':
		case 'A':
			if (quantifier === '*') {
				quantifier = data.length - dataPointer;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier);
			dataPointer += quantifier;
	
			if (instruction === 'a') {
				currentResult = currentData.replace(/\0+$/, '');
			} else {
				currentResult = currentData.replace(/ +$/, '');
			}
			result[label] = currentResult;
			break;
		case 'h':
		case 'H':
			if (quantifier === '*') {
				quantifier = data.length - dataPointer;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier);
			dataPointer += quantifier;
			if (quantifier > currentData.length) {
				throw new Error('Warning: unpack(): Type ' + instruction + ': not enough input, need ' + quantifier);
			}
			currentResult = '';
			for (i = 0; i < currentData.length; i++) {
				word = currentData.charCodeAt(i).toString(16);
				if (instruction === 'h') {
					word = word[1] + word[0];
				}
				currentResult += word;
			}
			result[label] = currentResult;
			break;
		case 'c':
		case 'C':
			if (quantifier === '*') {
				quantifier = data.length - dataPointer;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier);
			dataPointer += quantifier;
			for (i = 0; i < currentData.length; i++) {
				currentResult = currentData.charCodeAt(i);
				if ((instruction === 'c') && (currentResult >= 128)) {
					currentResult -= 256;
				}
				result[label + (quantifier > 1 ?
					(i + 1) :
					'')] = currentResult;
			}
			break;
		case 'S':
		case 's':
		case 'v':
			if (quantifier === '*') {
				quantifier = (data.length - dataPointer) / 2;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier * 2);
			dataPointer += quantifier * 2;
	
			for (i = 0; i < currentData.length; i += 2) {
				currentResult = ((currentData.charCodeAt(i + 1) & 0xFF) << 8) +
					(currentData.charCodeAt(i) & 0xFF);
				if ((instruction === 's') && (currentResult >= 32768)) {
					currentResult -= 65536;
				}
				result[label + (quantifier > 1 ?
					((i / 2) + 1) :
					'')] = currentResult;
			}
			break;
		case 'n':
			if (quantifier === '*') {
				quantifier = (data.length - dataPointer) / 2;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier * 2);
			dataPointer += quantifier * 2;
			for (i = 0; i < currentData.length; i += 2) {
				currentResult = ((currentData.charCodeAt(i) & 0xFF) << 8) +
					(currentData.charCodeAt(i + 1) & 0xFF);
				result[label + (quantifier > 1 ? ((i / 2) + 1) : '')] = currentResult;
			}
			break;
		case 'i':
		case 'I':
		case 'l':
		case 'L':
		case 'V':
			if (quantifier === '*') {
				quantifier = (data.length - dataPointer) / 4;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier * 4);
			dataPointer += quantifier * 4;
			for (i = 0; i < currentData.length; i += 4) {
				currentResult =
					((currentData.charCodeAt(i + 3) & 0xFF) << 24) +
					((currentData.charCodeAt(i + 2) & 0xFF) << 16) +
					((currentData.charCodeAt(i + 1) & 0xFF) << 8) +
					((currentData.charCodeAt(i) & 0xFF));
				result[label + (quantifier > 1 ?((i / 4) + 1) :'')] = currentResult;
			}
			break;
		case 'N':
			if (quantifier === '*') {
				quantifier = (data.length - dataPointer) / 4;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
			currentData = data.substr(dataPointer, quantifier * 4);
			dataPointer += quantifier * 4;
			for (i = 0; i < currentData.length; i += 4) {
				currentResult =
					((currentData.charCodeAt(i) & 0xFF) << 24) +
					((currentData.charCodeAt(i + 1) & 0xFF) << 16) +
					((currentData.charCodeAt(i + 2) & 0xFF) << 8) +
					((currentData.charCodeAt(i + 3) & 0xFF));
				result[label + (quantifier > 1 ? ((i / 4) + 1) : '')] = currentResult;
			}
			break;
		case 'f':
		case 'd':
			ebits = 8;
			fbits = (instruction === 'f') ? 23 : 52;
			dataByteLength = 4;
			if (instruction === 'd') {
				ebits = 11;
				dataByteLength = 8;
			}
	
			if (quantifier === '*') {
				quantifier = (data.length - dataPointer) / dataByteLength;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
	
			currentData = data.substr(dataPointer, quantifier * dataByteLength);
			dataPointer += quantifier * dataByteLength;
	
			for (i = 0; i < currentData.length; i += dataByteLength) {
				data = currentData.substr(i, dataByteLength);
		
				bytes = [];
				for (j = data.length - 1; j >= 0; --j) {
					bytes.push(data.charCodeAt(j));
				}
				result[label + (quantifier > 1 ? ((i / 4) + 1) : '')] = fromIEEE754(bytes, ebits, fbits);
			}
	
			break;
	
		case 'x':
		case 'X':
		case '@':
			if (quantifier === '*') {
				quantifier = data.length - dataPointer;
			} else {
				quantifier = parseInt(quantifier, 10);
			}
	
			if (quantifier > 0) {
				if (instruction === 'X') {
					dataPointer -= quantifier;
				} else {
					if (instruction === 'x') {
					dataPointer += quantifier;
					} else {
					dataPointer = quantifier;
					}
				}
			}
			break;
		default:
			throw new Error('Warning:	unpack() Type ' + instruction + ': unknown format code');
		}
	}
	return result;
}
function bin2hex(binary) {
	var hex = '';
	for (let i = 0; i < binary.length; i++) {
		var byte = binary.charCodeAt(i).toString(16);
		hex += byte.padStart(2, '0');
	}
	return hex;
}
function hex2bin(hex) {
	var binary = '';
	for (let i = 0; i < hex.length; i += 2) {
		var byte = parseInt(hex.substr(i, 2), 16);
		binary += String.fromCharCode(byte);
	}
	return binary;
}

function hexdec(hex){
	return parseInt(hex,16);
}
function dechex(dec){
	return dec.toString(16).padStart(2, '0');
}

class LEA {
	encrypt(str, pubkey) {
		str = this.text2dec(str);
		const decode = Base64.decode(pubkey);
		const e = unpack('i',decode.substr(0,4))[''];
		const n = unpack('i',decode.substr(4,4))[''];
		for (let i = 0; i < str.length; i++) {
			str[i] = this.encrypt_char(str[i].toString(), e, n);
		}
		return this.ascii2text(str);
	}

	decrypt(str, prikey) {
		str = this.text2ascii(str);
		const decode = Base64.decode(prikey);
		const d = unpack('i',decode.substr(0,4))[''];
		const n = unpack('i',decode.substr(4,4))[''];
		for (let i = 0; i < str.length; i++) {
			console.log(str[i]);
			str[i] = this.decrypt_char(str[i].toString(), d, n);
		}
		return this.dec2text(str);
	}

	encrypt_char(t, e, n) {
		return bcpowmod(init(t), e, n);
	}

	decrypt_char(c, d, n) {
		return bcpowmod(init(c), d, n);
	}


	text2dec(text) {
		text = bin2hex(text);
		return text.split('').map(char => hexdec(bin2hex(char)));
	}

	dec2text(dec) {
		let text = "";
		for (const char of dec) {
			text += dechex(Number(char));
		}
		return hex2bin(hex2bin(text));
	}

	text2ascii(text) {
		return text.split('').map(char => char.charCodeAt(0));
	}

	ascii2text(ascii) {
		let text = "";
		for (const char of ascii) {
			text += String.fromCharCode(char);
		}
		return text;
	}
}

if (typeof(Storage) !== "undefined") {
	var PublicKey = localStorage.getItem("PublicKey");
	if(PublicKey == null){
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				r = JSON.parse(xhttp.responseText);
				localStorage.setItem("PublicKey",r['PublicKey']);
				location.reload();
			}
		};
		xhttp.open("GET", "worker/getPublicKey.php", true);
		xhttp.send();
	}
	var LunarEncryptiomAlgorithm = new LEA();
}
function encryptPassword(password){
	return Base64.encode(LunarEncryptiomAlgorithm.encrypt(password, PublicKey));
}