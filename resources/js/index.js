if (typeof(Storage) !== "undefined") {
	var a = localStorage.getItem("language");
	var d = localStorage.getItem("language_data");
	if(a == null){
		localStorage.setItem("language",'en-us');
		a = 'en-us';
	}
	if(d == null){
		$.get("resources/language/" + a + ".json", function(r) {
			localStorage.setItem("language_data",JSON.stringify(r));
			d = JSON.stringify(r);
		}).done(function() {
			location.reload();
		});
	}
	var j = JSON.parse(d);
	Object.keys(j).forEach(function(v,n){
		window[v] = j[v];
	});
}
function load_lang(){
	var i = document.getElementsByTagName('lang');
	Object.keys(i).forEach(function (n){
		var e = i[n];
		var s = e.getAttribute('lang');
		if(e.getAttribute('lang_set') != 'true'){
			var t = e.tagName.toLocaleLowerCase();
			var l = window[s];
			switch(t){
				case 'input':
					var a = e.getAttribute('type');
					if(a == 'submit' || a == 'button'){
						e.value = l;
					}else{
						e.placeholder = l;
					}
					break;
			}
			e.innerHTML = l;
			e.setAttribute('lang_set','true');
		}
	});
	var h = document.getElementsByTagName('input');
	Object.keys(h).forEach(function (n){
		var e = h[n];
		var s = e.getAttribute('lang');
		if(e.getAttribute('lang_set') != 'true' && s != null){
			var t = e.tagName.toLocaleLowerCase();
			var l = window[s];
			var a = e.getAttribute('type');
			if(a == 'submit' || a == 'button')
				e.value = l;
			else
				e.placeholder = l;
			e.setAttribute('lang_set','true');
		}
	});
}
load_lang();
var isMobile = function() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	
	return check;
};
if(isMobile()){
	document.getElementsByClassName('container')[0].style.width = "100%";
}
document.getElementsByClassName('container')[0].style.zoom = "0.75";
function openTab(evt, choice) {
	var tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	var tablink = document.getElementsByClassName("tablink");
	for (i = 0; i < tablink.length; i++) {
		tablink[i].classList.remove("active");
	}
	document.getElementById(choice).style.display = "block";
	evt.currentTarget.classList.add("active");
	if (typeof(Storage) !== "undefined") {
		localStorage.recent = evt.currentTarget.getAttribute('id');
	}
}

function refreshCaptcha(x){
	v = document.getElementById('captchaimg'+ x);
	v.src = "data/captcha.php";
}
function validateEmail(email) {
	var emailformat = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\"[^\s@]+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!email.match(emailformat))
		return false;
	return true;
}
function validateLogin() {
	clearRequiredFields();
	var required = document.getElementsByClassName("required");
	var useremail = document.getElementById("loginuseremail").value;
	var userpass = document.getElementById("loginuserpass").value;
	var capcha = document.getElementById("captcha_0").value;
	var rememberme = document.getElementById("remember-me").checked;
	var result = true;
	if (useremail == "") {
		required[0].innerHTML = window['lang__46'];
		result = false;
	}
	if (userpass == "") {
		required[1].innerHTML = window['lang__46'];
		result = false;
	}
	if(result){
		d = new FormData();
		d.append('login','1');
		d.append('userlogin',useremail);
		d.append('userpass',userpass);
		d.append('captcha',capcha);
		if(rememberme)
			d.append('remember_me','1');
		$.ajax('/worker/login_register.php', {
			method: "POST",
			data: d,
			processData: false,
			contentType: false,
			success: function (q) {
				refreshCaptcha(0);
				if(q['success'] == 0){
					error(q['err']);
				}else{
					location.href = q['go'];
				}
			}
		});
	}
	return false;
}

function validateRegister() {
	clearRequiredFields();
	var required = document.getElementsByClassName("required");
	var userfirstname = document.getElementById("userfirstname").value;
	var userlastname = document.getElementById("userlastname").value;
	var usernickname = document.getElementById("usernickname").value;
	var userpass = document.getElementById("userpass").value;
	var userpassconfirm = document.getElementById("userpassconfirm").value;
	var birthday = document.getElementById("birthday").value;
	var useremail = document.getElementById("useremail").value;
	var usergender = document.getElementsByClassName("usergender");
	usergender[2].checked = true;
	var result = true;
	if (userfirstname == "") {
		required[2].innerHTML = window['lang__46'];
		result = false;
	}
	if (userlastname == "") {
		required[3].innerHTML = window['lang__46'];
		result = false;
	}
	if (usernickname == "") {
		required[4].innerHTML = window['lang__46'];
		result = false;
	}
	if (userpass == "") {
		required[5].innerHTML = window['lang__46'];
		result = false;
	}
	if (userpassconfirm == "") {
		required[6].innerHTML = window['lang__46'];
		result = false;
	}
	if (userpass != "" && userpassconfirm != "" && userpass != userpassconfirm) {
		required[5].innerHTML = window['lang__47'];
		required[6].innerHTML = window['lang__47'];
		result = false;
	}
	if (useremail == "") {
		required[7].innerHTML = window['lang__46'];
		result = false;
	} else if (!validateEmail(useremail)) {
		required[7].innerHTML = window['lang__48'];
		result = false;
	}
	if (!usergender[0].checked && !usergender[1].checked && !usergender[2].checked) {
		required[8].innerHTML = window['lang__49'];
		result = false;
	}
	if(result){
		d = new FormData();
		d.append('register','1');
		d.append('userfirstname',useremail);
		d.append('userlastname',userlastname);
		d.append('usernickname',usernickname);
		d.append('userpass',userpass);
		d.append('useremail',useremail);
		d.append('birthday',birthday);
		d.append('usergender',(usergender[0].checked ? "M" : (usergender[1].checked ? "F" : (usergender[2].checked ? "U" : "U"))));
		d.append('captcha',capcha);
		$.ajax('/worker/login_register.php', {
			method: "POST",
			data: d,
			processData: false,
			contentType: false,
			success: function (q) {
				refreshCaptcha(1);
				if(q['success'] == 0){
					error(q['err']);
				}else{
					location.href = q['go'];
				}
			}
		});
	}
	return false;
}

function clearRequiredFields() {
	var required = document.getElementsByClassName("required");
	for (i = 0; i < required.length; i++) {
		required[i].innerHTML = "";
	}
}
if (typeof(Storage) !== "undefined") {
var current = localStorage.recent;
if (current) {
	var tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}
	var tablink = document.getElementsByClassName("tablink");
	for (i = 0; i < tablink.length; i++) {
		tablink[i].classList.remove("active");
	}
	if (current == "link1")
		document.getElementById("signin").style.display = "block";
	else
		document.getElementById("signup").style.display = "block";
	document.getElementById(current).classList.add("active");
}
}
function get(n){
	if(n=(new RegExp('[?&]'+encodeURIComponent(n)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(n[1]);
}
function error(e){
	switch(e){
		case "exist_email":
			document.getElementsByClassName("required")[7].innerHTML = window["lang__050"];
			break;
		case "exist_nickname":
			document.getElementsByClassName("required")[4].innerHTML = window["lang__051"];
			break;
		case "invalid_nickname":
			document.getElementsByClassName("required")[4].innerHTML = window["lang__052"];
			break;
		case "invalid_date":
			document.getElementsByClassName("required")[8].innerHTML = window["lang__053"];
			break;
		case "invalid_email":
			document.getElementsByClassName("required")[7].innerHTML = window["lang__054"];
			break;
		case "invalid_login":
			document.getElementsByClassName("required")[0].innerHTML = window["lang__055"];
			document.getElementsByClassName("required")[1].innerHTML = window["lang__055"];
			break;
		case "invalid_captcha_0":
			document.getElementById('required_0').innerHTML = window['lang__080'];
			break;
		case "invalid_captcha_1":
			document.getElementById('required_1').innerHTML = window['lang__080'];
			break;
	}
}
if(get('err') != undefined){
	var err = get('err');
	error(e);
}
for(let x = 0; x < 2; x++){
	v = document.getElementById('captcha_'+ x);
	var l;
	v.addEventListener('keyup', e => {
		clearTimeout(l);
		l = setTimeout(() => {
			d = new FormData();
			d.append('captcha',e.target.value);
			$.ajax('/worker/checkCaptcha.php', {
				method: "POST",
				data: d,
				processData: false,
				contentType: false,
				success: function (q) {
					z = document.getElementById('required_' + x);
					if(q == 0){
						m = window['lang__080'];
					}else{
						m = '';
					}
					z.innerHTML = m;
				}
			});
		}, 500);
	});
}