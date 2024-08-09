const default_male_pfp = 'data/images.php?t=default_M';
const default_female_pfp = 'data/images.php?t=default_F';
const pfp_cdn = 'data/images.php?t=profile';
const media_cdn = 'data/images.php?t=media';
const video_cdn = 'data/videos.php?t=media';

var lang__001 = 'Post';
var lang__002 = 'Public';
var lang__003 = 'Private';
var lang__004 = 'Friend only';
var lang__005 = 'Request Pending';
var lang__006 = 'Send Friend Request';
var lang__007 = 'You must type Your Number';
var lang__008 = 'Phone Number must contain digits only';
var lang__009 = "You can't Leave the Caption Empty";
var lang__010 = "You don't yet have any friends";
var lang__011 = "You have no pending friend requests";
var lang__012 = "Nothing new yet...";
var lang__013 = "Cant display this post";
var lang__014 = "Show more";
var lang__015 = "Write something...";
var lang__016 = "Verified";

var lang__017 = "Post something...";
var lang__018 = "Notification";
var lang__019 = "Search Results";
var lang__020 = "Friend Requests";
var lang__021 = "Friends";
var lang__022 = "Login";
var lang__023 = "Password";
var lang__024 = "Remember Me?";
var lang__025 = "First Name";
var lang__026 = "Last Name";
var lang__027 = "Nickname";
var lang__028 = "Confirm Password";
var lang__029 = "Birth Date";
var lang__030 = "Male";
var lang__031 = "Female";
var lang__032 = "Create Account";
var lang__033 = "Account";
var lang__034 = "Profile";
var lang__035 = "About";
var lang__036 = "Email";
var lang__037 = "Verified Status";
var lang__038 = "Logout";
var lang__039 = "Home Town";

function load_lang(){
	for(let i = 0; i < 999; i++){
		var s = ((i.toString().length == 1) ? '00' : ((i.toString().length == 2) ? '0' : '0')) + i;
		var e = gebi('set_lang__' + s);
		if(typeof(e) != 'undefined' && e != null){
			if(e.getAttribute('lang_set') != 'true'){
				var t = e.tagName.toLocaleLowerCase();
				var l = window["lang__" + s];
				switch(t){
					case 'input':
						var a = e.getAttribute('type');
						if(a == 'submit' || a == 'button'){
							e.value = l;
						}else{
							e.placeholder = l;
						}
						break;
					case 'a':
					case 'p':
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
					case 'h5':
					case 'label':
					case 'lang':
					default:
						e.innerHTML = l;
						break;
				}
				console.log("set lang for " + s);
				e.setAttribute('lang_set','true');
			}
		}
	}
}
function gebi(id){
	return document.getElementById(id);
}
function gebcn(id){
	return document.getElementsByClassName(id);
}
function gebtn(id){
	return document.getElementsByTagName(id);
}
function preview(input){
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (event){
			var match = reader.result.match(/^data:([^/]+)\/([^;]+);/) || [];
			var type = match[1];
			var format = match[2];
			$('#preview_' + type).css('display', 'initial');
			if(type == 'video'){
				var video = gebi("preview_video");
				video.setAttribute('src', event.target.result);
				video.setAttribute('type', type + '/' + format);
			}else{
				$('#preview_' + type).attr('src', event.target.result);
			}
		}
		reader.readAsDataURL(input.files[0]);
	}
}
function make_blob_url(c, f){
	var blob = new Blob([c], { type: f });
	var blobUrl = URL.createObjectURL(blob);
	return blobUrl;
}
function load_video(i, h, f, e){
	var url = video_cdn + '&id=' + i + '&h=' + h;
	$.ajax({
		type: "HEAD",
		async: true,
		url: url,
	}).done(function(message,text,jqXHR){
		var ContentSize = Number(jqXHR.getResponseHeader('Content-Length'));
		if(ContentSize > 33554432){
			e.setAttribute("src",url);
		}else{
			$.ajax({
				xhr: function(){
					var xhr = new XMLHttpRequest();
					xhr.rType = 'blob';
					return xhr;
				},
				url: url,
				type: 'GET',
				async: true,
				success: function(res) {
					var blobUrl = make_blob_url(res, f);
					e.setAttribute("src",blobUrl);
				}
			});
		}
    });
}
function showPath(){
	var path = gebi("selectedFile").value;
	path = path.replace(/^.*\\/, "");
	gebi("path").innerHTML = path;
}
function validateNumber(){
	var number = gebi("phonenum").value;
	var required = gebcn("required");
	if(number == ""){
		required[0].innerHTML = lang__007;
		return false;
	} else if(isNaN(number)){
		required[0].innerHTML = lang__008;
		return false;
	}
	return true;
}
$("textarea").each(function() {
	this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function() {
	this.style.height = 0;
	this.style.height = (this.scrollHeight) + "px";
});
function timeConverter(t){
	var a = new Date(t);
	var y = a.getFullYear();
	var m = a.getMonth() + 1;
	var d = a.getDate();
	var h = a.getHours();
	var i = a.getMinutes();
	var s = a.getSeconds();
	var r = d + '/' + m + '/' + y + ' ' + h + ':' + i + ':' + s ;
	return r;
}
function birthdateConverter(t){
	var a = new Date(t);
	var y = a.getFullYear();
	var m = a.getMonth() + 1;
	if(m.toString().length == 1)
		m = '0' + m;
	var d = a.getDate();
	if(d.toString().length == 1)
		d = '0' + d;
	var r = y + '-' + m + '-' + d;
	return r;
}
function timeSince(date) {
	var seconds = Math.floor((new Date() - date) / 1000);
	var interval = seconds / 31536000;
	if (interval > 1) {
		return Math.floor(interval) + " y";
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return Math.floor(interval) + " m";
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return Math.floor(interval) + " d";
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return Math.floor(interval) + " hr";
	}
	interval = seconds / 60;
	if (interval > 1) {
		return Math.floor(interval) + " min";
	}
	return Math.floor(seconds) + " seconds";
}

function _like(id) {
	$.get("worker/likes.php?post_id=" + id, function(data) {
		var splt = data.split(";");
		var post_like = gebi("post-like-" + id);
		var class_l = "icon-heart fa-heart icon-click";
		if (splt[0] === "1") {
			post_like.className = class_l + " fa-solid p-heart";
			post_like.classList.toggle("active");
		} else {
			post_like.className = class_l + " fa-regular white-col";
		}
		zTemplate(gebi("post-like-count-" + id), {
			"counter": parseInt(splt[1])
		});
	});
}
function loading_bar(percent){
	gebi("loading_bar").style.width = percent + "%";
}
localStorage.setItem("cgurl",0);
function changeUrl(url) {
	window.scrollTo({top: 0, behavior: 'smooth'});
	localStorage.setItem("cgurl",1);
	loading_bar(70)
	$.ajax({
		url: url,
		type: 'GET',
		success: function(res) {
			_online();
			loading_bar(100)
			processAjaxData(res, url);
			localStorage.setItem("cgurl",0);
		},
		error: function(){
			localStorage.setItem("cgurl",0);
		}
	});
}
function processAjaxData(r, u) {
	var el = document.createElement("html");
	el.innerHTML = r;
	var container = el.getElementsByClassName('container');
	var style = el.getElementsByTagName('style');
	var docStyle = gebtn('style');
	var docHead = gebtn('head');
	if(style.length > 0){
		if(docStyle.length == 0){
			var StyleNode = document.createElement("style");
			StyleNode.innerHTML = style[0].innerHTML;
			docHead[0].appendChild(StyleNode);
		}else{
			docStyle[0].innerHTML = style[0].innerHTML;
		}
	}else{
		if(docStyle.length > 0){
			docStyle[0].innerHTML = '';
		}
	}
	gebcn('container')[0].innerHTML = container[0].innerHTML;
	load_lang();
	var title = $(r).filter('title').text();
	document.title = title;
	window.history.pushState({
		"html": r,
		"pageTitle": title
	}, "", u);
	loading_bar(0);
	if (u.substring(0,13) === "/settings.php" || u.substring(0,12) === "settings.php")
		_load_settings();
	if (u === "/home.php" || u === "home.php")
		fetch_post("fetch_post.php");
	if (u === "/logout.php" || u === "logout.php")
		location.reload();
	if (u === "/friends.php" || u === "friends.php")
		fetch_friend_list('fetch_friend_list.php');
	if (u === "/requests.php" || u === "requests.php")
		fetch_friend_request('fetch_friend_request.php');
	if (u.substring(0,12) === "/profile.php" || u.substring(0,11) === "profile.php"){
		var add_header = "";
		if(u.substring(0,16) === "/profile.php?id=" || u.substring(0,15) === "profile.php?id=")
			add_header = "?id=" + get("id");
		fetch_profile("fetch_profile_info.php" + add_header);
		fetch_post("fetch_profile_post.php" + add_header);
	}
	if (u.substring(0,9) === "/post.php" || u.substring(0,8) === "post.php"){
		if(u.substring(0,13) === "/post.php?id=" || u.substring(0,12) === "post.php?id=")
			_load_post(get("id"));
		else
			window.history.go(-1);
	}
	changeUrlWork();
}
$(window).on("popstate", function (event, state) {
	var url = new URL(window.location.href);
	var u = url.pathname + url.search;
	if(localStorage.getItem("cgurl") == 0)
		changeUrl(u);
});
function fetch_pfp_box(){
	$.get("worker/profile_image.php", function(data) {
		var b = gebi('pfp_box');
		if(b != null){
			if (data['pfp_media_id'] > 0) {
				b.src = pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'];
			} else {
				if (data['user_gender'] == 'M')
					b.src = default_male_pfp;
				else if (data['user_gender'] == 'F')
					b.src = default_female_pfp;
			}
		}
	});
}
function fetch_post(loc) {
	fetch_pfp_box();
	$.get("worker/" + loc, function(data) {
		var f = '';
		var l = Object.keys(data).length;
		var page = gebi('page');
		var e = false;
		if (data["success"] == 1) {
			for (let i = 0; i < (l - 1); i++) {
				var s = data[i];
				var share_id = 0;
				var share_able = true;
				var a = "";
				a += '<div class="post" id="post_id-' + s['post_id'] + '">';
				a += '<div class="header">';
				if (s['pfp_media_id'] > 0) {
					a += '<img class="pfp" src="' + pfp_cdn + '&id=' + s['pfp_media_id'] + "&h=" + s['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (s['user_gender'] == 'M')
						a += '<img class="pfp" src="' + default_male_pfp + '" width="40px" height="40px">';
					else if (s['user_gender'] == 'F')
						a += '<img class="pfp" src="' + default_female_pfp + '" width="40px" height="40px">';
				}
				a += '<a class="fname profilelink" href="profile.php?id=' + s['user_id'] + '">' + s['user_firstname'] + ' ' + s['user_lastname'];
				if(s['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + s['verified'] + '" title="' + lang__016 + '"></i>';
				a += '<span class="nickname">@' + s['user_nickname'] + '</span>';
				a += '</a>';
				a += '<a class="public">';
				a += '<span class="postedtime" title="' + timeConverter(s['post_time'] * 1000) + '">';
				switch(Number(s['post_public'])){
					case 2:
						a += '<i class="fa-solid fa-earth-americas" title="' + lang__002 + '"></i>';
						break;
					case 1:
						a += '<i class="fa-solid fa-user-group" title="' + lang__004 + '"></i>';
						break;
					default:
						a += '<i class="fa-solid fa-lock" title="' + lang__003 + '"></i>';
						break;
				}
				a += " " + timeSince(s['post_time'] * 1000) + '</span>';;
				a += '</a>';
				a += '</div>';
				a += '<br>';
				if (s['post_media'] != 0) {
					if(s['post_caption'].split(/\r\n|\r|\n/).length > 13 || s['post_caption'].length > 1196){
						a += '<div class="caption_box" id="caption_box-'+s['post_id']+'">';
						a += '<div class="caption_box_shadow" id="caption_box_shadow-'+s['post_id']+'"><p onclick="showMore(\''+s['post_id']+'\')">' + lang__014 + '</p></div>';
					}else{
						a += '<div class="caption_box" style="height: 100%">';
					}
					a += '<pre class="caption">' + s['post_caption'] + '</pre></div>';
					a += '<center>';
					if(s['is_video'])
						a += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + s['post_id'] + '" controls></video>';
					else
						a += '<img src="' + media_cdn + "&id=" + s['post_media'] + "&h=" + s['media_hash'] + '" style="max-width:100%;">';
					a += '<br><br>';
					a += '</center>';
				} else {
					if(s['is_share'] == 0 && s['post_caption'].replace(/^\s+|\s+$/gm,'').length < 20){
						a += '<center>';
						if(s['post_caption'].split(/\r\n|\r|\n/).length > 3){
							a += '<div class="caption_box" id="caption_box-'+s['post_id']+'">';
							a += '<div class="caption_box_shadow" id="caption_box_shadow-'+s['post_id']+'"><p onclick="showMore(\''+s['post_id']+'\')">' + lang__014 + '</p></div>';
						}else{
							a += '<div class="caption_box" style="height: 100%">';
						}
						a += '<pre class="caption" style="font-size: 300%">' + s['post_caption'] + '</pre></div>';
						a += '</center>';
					}else{
						if(s['post_caption'].split(/\r\n|\r|\n/).length > 13 || s['post_caption'].length > 1196){
							a += '<div class="caption_box" id="caption_box-'+s['post_id']+'">';
							a += '<div class="caption_box_shadow" id="caption_box_shadow-'+s['post_id']+'"><p onclick="showMore(\''+s['post_id']+'\')">' + lang__014 + '</p></div>';
						}else{
							a += '<div class="caption_box" style="height: 100%">';
						}
						a += '<pre class="caption">' + s['post_caption'] + '</pre></div>';
					}
				}
				a += '<br>';
				if (s['is_share'] != 0) {
					var pflag = false;
					pflag = s['share']["pflag"];
					a += '<div class="share-post" id="post_id-' + s['share']['post_id'] + '">';
					if (pflag) {
						a += '<div class="header">';

						if (s['share']['pfp_media_id'] > 0) {
							a += '<img class="pfp" src="' + pfp_cdn + '&id=' + s['share']['pfp_media_id'] + "&h=" + s['share']['pfp_media_hash'] + '" width="40px" height="40px">';
						} else {
							if (s['share']['user_gender'] == 'M')
								a += '<img class="pfp" src="' + default_male_pfp + '" width="40px" height="40px">';
							else if (s['share']['user_gender'] == 'F')
								a += '<img class="pfp" src="' + default_female_pfp + '" width="40px" height="40px">';
						}

						a += '<a class="fname profilelink" href="profile.php?id=' + s['share']['user_id'] + '">' + s['share']['user_firstname'] + ' ' + s['share']['user_lastname'];
						if(s['share']['verified'] > 0)
							a += '<i class="fa-solid fa-badge-check verified_color_' + s['share']['verified'] + '" title="' + lang__016 + '"></i>';
						a += '<span class="nickname">@' + s['share']['user_nickname'] + '</span>';
						a += '</a>';
						a += '<a class="public">';
						a += '<span class="postedtime" title="' + timeConverter(s['share']['post_time'] * 1000) + '">';
						if (s['share']['post_public'] == 2) {
							a += '<i class="fa-solid fa-earth-americas" title="' + lang__002 + '"></i>';
						} else if (s['share']['post_public'] == 1) {
							a += '<i class="fa-solid fa-user-group" title="' + lang__004 + '"></i>';
						} else {
							a += '<i class="fa-solid fa-lock" title="' + lang__003 + '"></i>';
						}
						a += " " + timeSince(s['share']['post_time'] * 1000) + '</span>';;
						a += '</a>';
						a += '<br>';
						a += '</div>';
						if (s['post_media'] !== 0) {
							if(s['share']['post_caption'].split(/\r\n|\r|\n/).length > 13 || s['share']['post_caption'].length > 1196){
								a += '<div class="caption_box" id="caption_box-'+s['is_share']+'shd">';
								a += '<div class="caption_box_shadow" id="caption_box_shadow-'+s['is_share']+'shd"><p onclick="showMore(\''+s['is_share']+'shd\')">' + lang__014 + '</p></div>';
							}else{
								a += '<div class="caption_box" style="height: 100%">';
							}
							a += '<pre class="caption">' + s['share']['post_caption'] + '</pre></div>';

							a += '<center>';
							if(s['share']['is_video'])
								a += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + s['share']['post_id'] + 's" controls></video>';
							else
								a += '<img src="' + media_cdn + "&id=" + s['share']['post_media'] + "&h=" + s['share']['media_hash'] + '" style="max-width:100%;">';
							a += '<br><br>';
							a += '</center>';
						} else {
							a += '<center>';
							if(s['share']['post_caption'].split(/\r\n|\r|\n/).length > 3 || s['share']['post_caption'].length > 60){
								a += '<div class="caption_box" id="caption_box-'+s['is_share']+'shd">';
								a += '<div class="caption_box_shadow" id="caption_box_shadow-'+s['is_share']+'shd"><p onclick="showMore(\''+s['is_share']+'shd\')">' + lang__014 + '</p></div>';
							}else{
								a += '<div class="caption_box" style="height: 100%">';
							}
							a += '<pre class="caption" style="font-size: 300%">' + s['share']['post_caption'] + '</pre></div>';
							a += '</center>';
						}
						a += '<br>';

					} else {
						share_able = false;
						a += '<p style="font-size: 150%;text-align: center">' + lang__013 +'</p>';
					}
					a += '</div>';
					share_id = s['is_share'];
				}else{
					share_id = s['post_id'];
				}

				a += '<div class="bottom">';
				a += '<div class="reaction-bottom">';
				var liked = '';
				if (s['is_liked'] == 1)
					liked = 'p-heart fa-solid';
				else
					liked = 'white-col fa-regular';

				a += '<div class="reaction-box likes">';
				a += '<i onclick="_like(' + s['post_id'] + ')" class="' + liked + ' icon-heart fa-heart icon-click" id="post-like-' + s['post_id'] + '"></i>';
				a += ' <a z-var="counter call roller" id="post-like-count-' + s['post_id'] + '">' + s['total_like'] + '</a>';
				a += '</div>';

				a += '<div class="reaction-box comment">';
				a += '<i onclick="_open_post(' + s['post_id'] + ')" class="fa-regular fa-comment icon-click" id="post-comment-' + s['post_id'] + '"></i>';
				a += ' <a z-var="counter call roller" id="post-comment-count-' + s['post_id'] + '">' + s['total_comment'] + '</a>';
				a += '</div>';
				if(share_able){
					a += '<div class="reaction-box share">';
					a += '<i onclick="_share(' + share_id + ')" class="fa-regular fa-share icon-click" id="post-share-' + s['post_id'] + '"></i>';
					a += ' <a z-var="counter call roller" id="post-share-count-' + s['post_id'] + '">' + s['total_share'] + '</a>';
					a += '</div>';
				}

				a += '</div>';
				a += '</div>';
				a += '</div>';
				a += '</br>';
				f += a;
			}
		} else {
			e = true;
			f += '<div class="post">';
			f += '<h1>' + lang__012 + '</h1>';
			f += '</div>';
		}
		if(page.value != -1){
			if(e)
				 page.value = -1;
			gebi("feed").innerHTML += f;
			
			for (let i = 0; i < (l - 1); i++) {
				var s = data[i];
				var _pvideo = gebi("video_pid-" + s['post_id']);
				var _psvideo = gebi("video_pid-" + s['post_id'] + 's');
				if(_pvideo != null)
					load_video(s['post_media'], s['media_hash'], s['media_format'], _pvideo);
				if(_psvideo != null)
					load_video(s['share']['post_media'], s['share']['media_hash'], s['share']['media_format'], _psvideo);
			}
			HighLightHLJS();
		}
		if(isMobile()){
			$(".post").each(function() {
				this.style.border = "none";
				this.style.borderLeft = "none";
				this.style.borderRight = "none";
				this.style.width = "100%";
				this.style.marginRight = "0";
			});
			$(".header .pfp").each(function() {
				this.style.height = "80px";
				this.style.width = "80px";
			});
			$(".postedtime").each(function() {
				this.style.marginLeft = "85px";
			});
			$(".caption_box_shadow").each(function() {
				this.style.width = "calc(97.9%)";
			});
			$(".fname").each(function() {
				this.style.marginTop = "-85px";
				this.style.marginLeft = "85px";
			});
			$("pre.caption").each(function() {
				this.style.width = "calc(97.9%)";
			});
		}
		changeUrlWork();
	});
}
function get(n){
	if(n=(new RegExp('[?&]'+encodeURIComponent(n)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(n[1]);
}
function modal_close() {
	gebi("modal").style.display = "none";
	gebtn('body')[0].style.overflowY = "scroll";
}
function _load_comment(id, page){
	$.get("worker/fetch_comment.php?id=" + id + "&page=" + page, function(data) {
		var b = gebi("comment-box");
		var a = '';
		if(data['success'] == 2)
			gebi('page').value = -1;
		if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				a += '<div class="comment">';
				if (data[i]['pfp_media_id'] > 0) {
					a += '<img class="pfp comment-pfp" src="' + pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (data[i]['user_gender'] == 'M')
						a += '<img class="pfp comment-pfp" src="' + default_male_pfp + '" width="40px" height="40px">';
					else if (data[i]['user_gender'] == 'F')
						a += '<img class="pfp comment-pfp" src="' + default_female_pfp + '" width="40px" height="40px">';
				}
				a += '<a class="profilelink cmt_user_name" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="' + lang__016 + '"></i>';
				a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				a += '</a>';
				a += '<span class="cmt_postedtime" title="' + timeConverter(data[i]['comment_time'] * 1000) + '">' + timeSince(data[i]['comment_time'] * 1000) + '</span>';
				a += '<pre class="comment-text">' + data[i]['comment'] + '</pre>';
				a += '</div>';
				a += '<hr/>';
			}
		}
		b.innerHTML += a;
		b.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 55) + "px";
		changeUrlWork();
	});
}
function _share(id) {
	gebtn('body')[0].style.overflowY = "hidden";
	$.get("worker/fetch_post_info.php?id=" + id, function(data) {
		gebi("modal").style.display = "block";
		var s = data;
		var a = "";
		
		a += '	<div class="createpost_box">';
		a += '		<div>';
		a += '		<br>';
		a += '		<br>';
		a += '			<span style="float:right; color:black">';
		a += '			<input type="hidden" name="post_id" id="post_id" value="'+s['post_id']+'">';
		a += '			<select name="private" id="private">';
		a += '				<option value="2">' + lang__002 + '</option>';
		a += '				<option value="1">' + lang__004 + '</option>';
		a += '				<option value="0">' + lang__003 + '</option>';
		a += '			</select>';
		a += '			</span>';
		a += '			<img class="pfp" src="' + gebi('pfp_box').src + '" width="40px" height="40px"><a class="fname">' + gebi('fullname').value + "</a>";
		a += '			<span class="required" style="display:none;">' + lang__009 + '</span><br>';
		a += '			<textarea rows="6" name="caption" class="caption" placeholder="' + lang__015 + '"></textarea>';
		a += '			<center><img src="" id="preview_image" style="max-width:100%; display:none;"><video id="preview_video" style="max-width:100%; display:none;"></video></center>';
		a += '			<div class="createpostbuttons">';
		a += '				<label>';
		a += '					<i class="fa-regular fa-image"></i>';
		a += '					<input type="file" name="fileUpload" id="imagefile">';
		a += '				</label>';
		a += '				<input type="button" value="Share" name="post" onclick="return validatePost(1)">';
		a += '			</div>';
		a += '		</div>';
		a += '		<br>';
		
		a += '<div class="post">';
		a += gebi("post_id-" + id).innerHTML;
		a += '</div>';
		
		gebi("modal_content").innerHTML = a;
		
		$(document).ready(function(){
				$('#imagefile').change(function(){
					preview(this);
				});
			});
		var textarea = gebtn("textarea")[0];
		textarea.oninput = function() {
			textarea.style.height = "";
			textarea.style.height = Math.min(textarea.scrollHeight, 1280) + "px";
		};
	});
}
function make_post(){
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "block";
	var a = "";
	a += '	<div class="createpost_box">';
	a += '		<div>';
	a += '		<br>';
	a += '		<br>';
	a += '			<h2>Make Post</h2>';
	a += '			<hr>';
	a += '			<span style="float:right; color:black">';
	a += '			<select name="private" id="private">';
	a += '				<option value="2">' + lang__002 + '</option>';
	a += '				<option value="1">' + lang__004 + '</option>';
	a += '				<option value="0">' + lang__003 + '</option>';
	a += '			</select>';
	a += '			</span>';
	a += '			<img class="pfp" src="' + gebi('pfp_box').src + '" width="40px" height="40px"><a class="fname">' + gebi('fullname').value + "</a>";
	a += '			<span class="required" style="display:none;">' + lang__009 + '</span><br>';
	a += '			<textarea rows="6" name="caption" class="caption" placeholder="' + lang__015 + '"></textarea>';
	a += '			<center><img src="" id="preview_image" style="max-width:100%; display:none;"><video id="preview_video" style="max-width:100%; display:none;"></video></center>';
	a += '			<div class="createpostbuttons">';
	a += '				<label>';
	a += '					<i class="fa-regular fa-image"></i>';
	a += '					<input type="file" accept="image/*,video/*" name="fileUpload" id="imagefile">';
	a += '				</label>';
	a += '				<input type="button" value="' + lang__001 + '" name="post" onclick="return validatePost(0)">';
	a += '			</div>';
	a += '		</div>';
	a += '	</div>';
	gebi("modal_content").innerHTML = a;
	$(document).ready(function(){
			$('#imagefile').change(function(){
				preview(this);
			});
		});
	var textarea = gebtn("textarea")[0];
	textarea.oninput = function() {
		textarea.style.height = "";
		textarea.style.height = Math.min(textarea.scrollHeight, 1280) + "px";
	};
}
function _open_post(id){
	changeUrl("post.php?id=" + id);
	_load_post(id);
}
function fetch_friend_list(loc){
	$.get("worker/" + loc, function(data) {
		var friend_list = gebi("friend_list");
		var a = '';
		a += '<center>';
		if(data['success'] == 2){
			a += '<div class="post">';
			a += lang__010;
			a += '</div>';
		} else if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				a += '<div class="frame">';
				a += '<center>';
				a += '<div class="pfp-box">';
				if(data[i]['pfp_media_id'] > 0) {
					a += '<img class="pfp" src="' + pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="168px" height="168px"	id="pfp"/>';
				} else {
					if(data[i]['user_gender'] == 'M')
						a += '<img class="pfp" src="' + default_male_pfp + '" width="168px" height="168px" id="pfp"/>';
					else if (data[i]['user_gender'] == 'F')
						a += '<img class="pfp" src="' + default_female_pfp + '" width="168px" height="168px" id="pfp"/>';
				}
				a += '<div class="status-circle ' + ( (data[i]['is_online']) ? 'online' : 'offline') + '-status-circle"></div>';
				a += '</div>';
				a += '<br>';
				a += '<a class="flist_link" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="' + lang__016 + '"></i>'; 
				a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				a += '</a>';
				a += '</center>';
				a += '</div>';
			}
		}
			
		a += '</center>';
		friend_list.innerHTML += a;
		changeUrlWork();
	});
}
function fetch_friend_request(loc){
	$.get("worker/" + loc, function(data) {
		var friend_reqest_list = gebi("friend_reqest_list");
		var a = '';
		a += '<center>';
		if(data['success'] == 2){
			a += '<div class="userquery">';
			a += lang__011;
			a += '<br><br>';
			a += '</div>';
		}else if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				a += '<div class="userquery">';
				if(data[i]['pfp_media_id'] > 0) {
					a += '<img class="pfp" src="' + pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="168px" height="168px"	id="pfp"/>';
				} else {
					if(data[i]['user_gender'] == 'M')
						a += '<img class="pfp" src="' + default_male_pfp + '" width="168px" height="168px" id="pfp"/>';
					else if (data['user_gender'] == 'F')
						a += '<img class="pfp" src="' + default_female_pfp + '" width="168px" height="168px"	id="pfp"/>';
				}
				a += '<br>';
				a += '<a class="profilelink" href="profile.php?id=' + data[i]['user_id'] +'">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0) 
					a += '<i class="fa-solid fa-badge-check verified_color_'+data[i]['verified']+'" title="' + lang__016 + '"></i>';
				a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
				a += '<a>';
				a += '<div id="toggle-fr-' + data[i]['user_id'] + '">';
				a += '<input type="submit" value="Accept" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',1)" name="accept">';
				a += '<br><br>';
				a += '<input type="submit" value="Ignore" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',0)" name="ignore">';
				a += '<br><br>';
				a +='</div>';
				a += '</div>';
				a += '<br>';
			}
		}
			
		a += '</center>';
		friend_reqest_list.innerHTML += a;
		changeUrlWork();
	});
}
function fetch_profile(loc){
	$.get("worker/" + loc, function(data) {
		if(data['success'] != 1) 
			window.history.go(-1);
		var profile = gebi("profile");
		var profile_cover = gebi("profile_cover");
		var a = '';
		a += '<center>';
		a += '<div class="profile_head">';
		if(data['pfp_media_id'] > 0) {
			a += '<img class="pfp" src="' + pfp_cdn + '&id=' + data['pfp_media_id'] + '&h=' + data['pfp_media_hash'] + '" width="200px" height="200px"	id="pfp"/>';
		} else {
			if(data['user_gender'] == 'M')
				a += '<img class="pfp" src="' + default_male_pfp + '" width="200px" height="200px" id="pfp"/>';
			else if (data['user_gender'] == 'F')
				a += '<img class="pfp" src="' + default_female_pfp + '" width="200px" height="200px"	id="pfp"/>';
		}
		if(data['cover_media_id'] > 0)
			profile_cover.style.backgroundImage = 'url("' + pfp_cdn + '&id=' + data['cover_media_id'] + '&h=' + data['cover_media_hash'] + '")';
		
		a += "<div class='user_name'>";
		a += data['user_firstname'] + ' ' + data['user_lastname'];
		
		if(data['verified'] > 0)
			a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="' + lang__016 + '"></i>';
		a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
		a += "</div>";
		a += '</div>';
		a += '<br>';
		a += '<br>';
		a += '<div class="about_me">';
		if(data['user_about'] != ''){
			a += '<h2>About me:</h2>';
			a += data['user_about'];
		}
		a += '<br>';
		a += '<br>';
		a += '<br>';
		if(data['user_gender'] == "M")
			a += 'Male';
		else if(data['user_gender'] == "F")
			a += 'Female';
		a += '<br>';
		if(data['user_status'] != ''){
			switch(data['user_status']){
				case "S":
					a += 'Single';
					break;
				case "E":
					a += 'Engaged';
					break;
				case "M":
					a += 'Married';
					break;
				case "L":
					a += 'In Love';
					break;
				default:
				case "U":
					a += 'Unknown';
					break;
			}
			a += '<br>';
		}
		a += birthdateConverter(data['user_birthdate'] * 1000);
		if(data['user_hometown'] == ''){
			a += '<br>';
			a += data['user_hometown'];
		}
		if(data['flag'] == 1){
			a += '<br>';
			if(data['friendship_status'] != null) {
				a += '<div>';
				a += (data['friendship_status'] == 1) ? '<input type="submit" onclick="_friend_toggle()" value="Friends" name="remove" id="special" class="fr_button">' : '<input type="submit" onclick="_friend_toggle()" value="' + lang__005 + ' name="remove" id="special" class="fr_button">';
				a += '</div>';
			} else {
				a += '<div>';
				a += '<input type="submit" onclick="_friend_toggle()" value="' + lang__006 + '" name="request" id="special" class="fr_button">';
				a += '</div>';
			}
		}
		a += '</center>';
		profile.innerHTML = a;
		if(isMobile()){
			var pfp_head = gebcn('profile_head')[0];
			var user_name = gebcn('user_name')[0];
			var about_me = gebcn('about_me')[0];
			var nickname = gebcn('nickname')[0];
			var feed = gebi('feed');
			pfp_head.style.marginLeft = "auto";
			user_name.style.marginTop = "0";
			user_name.style.marginLeft = "0";
			user_name.style.margin = "auto";
			user_name.style.width = "100%";
			about_me.style.marginLeft = "0";
			about_me.style.marginTop = "100px";
			about_me.style.width = "100%";
			about_me.style.borderRadius = "0";
			pfp_head.insertBefore(document.createElement("br"),pfp_head.children[1]);
			nickname.style.display = "block";
			profile.style.padding = "0px";
			profile.style.width = "100%";
			feed.style.marginTop = "20px";
		}
		changeUrlWork();
		onResizeEvent();
	});
}
function _load_post(id){
	$.get("worker/fetch_post_info.php?id=" + id, function(data) {
		if(data['success'] == 2)
			window.history.go(-1);
		var _content_left = gebi("_content_left");
		var _content_right = gebi("_content_right");
		var a = '';
		a += '<div class="rcf_box"></div>';
		a += '<div class="header" style="margin: 15px">';
		gebi("_content_left").style.height = ($(window).height() - 45) + "px";
		_content_right.style.height = ($(window).height() - 45) + "px";
		if(data['post_media'] > 0 || data['is_share'] > 0){
			var picture = gebi("picture");
			var video = gebi("video");
			if(data['is_share'] > 0){
				a += '<a style="text-align: center;" href="post.php?id='+data['is_share'] +'">View original post</a>';
				a += '<hr>';
				if(data['share']['is_video']){
					video.setAttribute('src', "data/empty.mp4");
					video.setAttribute('type', "video/mp4");
					video.setAttribute('id', data['share']['media_hash']);
					load_video(data['share']['post_media'],data['share']['media_hash'],data['share']['media_format'],gebi(data['media_hash']));
					picture.style.display = 'none';
				}else{
					picture.src = media_cdn + "&id=" + data['share']['post_media'] + "&h=" + data['share']['media_hash'];
					video.style.display = 'none';
				}
			}else{
				if(data['is_video']){
					video.setAttribute('src', "data/empty.mp4");
					video.setAttribute('type', "video/mp4");
					video.setAttribute('id', data['media_hash']);
					load_video(data['post_media'],data['media_hash'],data['media_format'],gebi(data['media_hash']));
					picture.style.display = 'none';
				}else{
					picture.src = media_cdn + "?t=media&id=" + data['post_media'] + "&h=" + data['media_hash'];
					video.style.display = 'none';
				}
			}
		}else{
			_content_left.style.display = 'none';
			_content_right.style.float = 'unset';
			_content_right.style.right = 'unset';
			_content_right.style.width = '80%';
			_content_right.style.margin = 'auto';
			_content_right.style.position = 'relative';
			a += '<style>.caption_box{overflow-y: auto;}.caption_box_shadow{margin-top:540px;width:99%;}.comment-form{width: calc(80% - 10px);}</style>';
		}
		if (data['pfp_media_id'] > 0) {
			a += '<img class="pfp" src="' + pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] + '" width="40px" height="40px">';
		} else {
			if (data['user_gender'] == 'M')
				a += '<img class="pfp" src="' + default_male_pfp + '" width="40px" height="40px">';
			else if (data['user_gender'] == 'F')
				a += '<img class="pfp" src="' + default_female_pfp + '" width="40px" height="40px">';
		}
		a += '<a class="fname profilelink" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
		if(data['verified'] > 0)
			a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="' + lang__016 + '"></i>';
		a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
		a += '</a>';
		a += '<a class="public">';
		a += '<span class="postedtime" title="' + timeConverter(data['post_time'] * 1000) + '">';
		switch(Number(data['post_public'])){
			case 2:
				a += '<i class="fa-solid fa-earth-americas" title="' + lang__002 + '"></i>';
				break;
			case 1:
				a += '<i class="fa-solid fa-user-group" title="' + lang__004 + '"></i>';
				break;
			default:
				a += '<i class="fa-solid fa-lock" title="' + lang__003 + '"></i>';
				break;
		}
		a += " " + timeSince(data['post_time'] * 1000) + '</span>';
		a += '</a>';
		a += '</div>';
		a += '<br>';
		if(data['post_caption'].split(/\r\n|\r|\n/).length > 13 || data['post_caption'].length > 1196){
			a += '<div class="caption_box" id="caption_box-'+data['post_id']+'">';
			a += '<div class="caption_box_shadow" id="caption_box_shadow-'+data['post_id']+'"><p onclick="showMore(\''+data['post_id']+'\')">' + lang__014 + '</p></div>';
		}else{
			a += '<div class="caption_box">';
		}
		a += '<pre class="caption">' + data['post_caption'] + '</pre></div>';
		
		a += '<hr />';
		a += '<div class="comment-box" id="comment-box">';
		a += '</div>';
		a += '<div class="comment-form">';
		a += '<textarea class="comment-form-text" placeholder="Comment something..." id="comment-form-text"></textarea>';
		a += '<div class="send-btn" onclick="send_comment()"><i class="fa-solid fa-paper-plane-top"></i></div>';
		a += '</div>';
		
		_content_right.innerHTML = a;
		_load_comment(data['post_id'],0);
		
		if(isMobile()){
			_content_right.style.float = 'unset';
			_content_right.style.right = 'unset';
			_content_left.style.width = '100%';
			_content_right.style.width = '100%';
			_content_right.style.borderLeft = 'none';
			_content_right.style.borderRight = 'none';
			_content_right.style.margin = 'auto';
			_content_right.style.position = 'relative';
			gebcn('comment-form')[0].style.width = "100%";
		}
		$("#comment-box").scroll(function() {
			var obj = this;
			if(obj.scrollTop === (obj.scrollHeight - obj.offsetHeight)){
				var page = gebi('page');
				if(page != -1){
					var nextPage = Number(page.value) + 1;
					_load_comment(get('id'), nextPage);
				}
			}
		});
		
		$("textarea").each(function() {
			this.setAttribute("style", "height:" + (this.scrollHeight*2.1) + "px;overflow-y:hidden;");
		}).on("input", function() {
			if(this.scrollHeight < 525){
				this.style.height = 0;
				this.style.height = (this.scrollHeight*2.1) + "px";
			}else{
				this.setAttribute("style", "height:525px;overflow-y:auto;");
			}
		});
		HighLightHLJS();
		changeUrlWork();
	});
}
function _friend_request_toggle(id,accept){
	var ac = '';
	if(accept == 1)
		ac = 'accept';
	else
		ac = 'ignore';
	$.get("worker/friend_request_toggle.php?id=" + id + "&" + ac, function(data) {
		if(data['success'] == 1){
			var t = gebi('toggle-fr-' + data['id']);
			var a = '';
			a += '<center>';
			a += 'accepted';
			a += '</center>';
			t.innerHTML = a;
		}
	});
}
function send_comment(){
	var text = gebi("comment-form-text").value;
	var f = new FormData();
	f.append('comment', text);
	$.ajax({
		type: "POST",
		url: "/worker/comment.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			$.get("worker/fetch_profile_info.php", function(data) {
				var b = gebi('comment-box');
				var a = '';
				a += '<div class="comment">';
				if (data['pfp_media_id'] > 0) {
					a += '<img class="pfp comment-pfp" src="' + pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (data['user_gender'] == 'M')
						a += '<img class="pfp comment-pfp" src="' + default_male_pfp + '" width="40px" height="40px">';
					else if (data['user_gender'] == 'F')
						a += '<img class="pfp comment-pfp" src="' + default_female_pfp + '" width="40px" height="40px">';
				}
				a += '<a class="profilelink cmt_user_name" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
				if(data['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="' + lang__016 + '"></i>';
				a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
				a += '</a>';
				a += '<span class="cmt_postedtime" title="' + timeConverter(Date.now()) + '">' + timeSince(Date.now()) + '</span>';
				a += '<pre class="comment-text">' + gebi("comment-form-text").value + '</pre>';
				a += '</div>';
				a += '<hr/>';
				b.innerHTML = b.innerHTML + a;
				gebi("comment-form-text").value = '';
				b.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 55) + "px";
				changeUrlWork();
			});
		}
	});
}
function _friend_toggle(){
	var special = gebi("special");
	var f = new FormData();
	f.append(special.name, '1');
	$.ajax({
		type: "POST",
		url: "/worker/friend_toggle.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			if(special.name == "request"){
				special.name = "remove";
				special.value = lang__005;
			}else{
				special.name = "request";
				special.value = lang__006;
			}
		}
	});
}
function showMore(id){
	var cap = gebi('caption_box-' + id);
	cap.style.height = (cap.children[1].clientHeight + 15) + "px";
	gebi('caption_box_shadow-' + id).style.display = "none";
}
function _online(){
	$.ajax({
		url: "/worker/online.php",
		type: 'GET',
		success: function(res) {
			if(res == 0)
				document.location = "/index.php";
		}
	});
	changeUrlWork();
}
function _fr_count(){
	$.ajax({
		url: "/worker/friend_request_count.php",
		type: 'GET',
		success: function(res) {
			gebi('friend_req_count').innerHTML = res;
		}
	});
}
function _load_hljs(){
	$.ajax({
		url: "/worker/hljs_lang_list.php",
		type: 'GET',
		success: function(res) {
			var hljs_lang_list= gebi('hljs_lang_list');
			for(let i = 0; i < res.length; i++){
				var ScriptLink = document.createElement("script");
				ScriptLink.src = "/resources/js/highlight/"+res[i];
				hljs_lang_list.appendChild(ScriptLink);
			}
		}
	});
	changeUrlWork();
}
function _load_settings(){
	var tab = get("tab");
	if(tab == undefined)
		tab = 'account';
	var current_tab = gebi('tab-' + tab);
	if(current_tab != null)
		current_tab.classList.add("active");
	var current_setting_tab = gebi('setting-tab-' + tab);
	if(current_setting_tab != null)
		current_setting_tab.style.display = "block";
	$.ajax({
		url: "/worker/fetch_profile_setting_info.php",
		type: 'GET',
		success: function(res) {
			var usernickname = gebi('usernickname');
			var userfirstname = gebi('userfirstname');
			var userlastname = gebi('userlastname');
			var malegender = gebi('malegender');
			var femalegender = gebi('femalegender');
			var email = gebi('email');
			var user_hometown = gebi('userhometown');
			var user_about = gebi('userabout');
			var verified = gebi('verified');
			var verified_text = gebi('verified-text');
			var birthday = gebi('birthday');
			var profile_picture = gebi('profile_picture');
			var setting_profile_cover = gebi('setting_profile_cover');
			var psrc = '';
			user_about.value = res['user_about'];
			user_hometown.value = res['user_hometown'];
			usernickname.value = res['user_nickname'];
			userfirstname.value = res['user_firstname'];
			userlastname.value = res['user_lastname'];
			email.value = res['user_email'];
			if(res['cover_media_id'] > 0)
				setting_profile_cover.style.backgroundImage = 'url("' + pfp_cdn + '&id=' + res['cover_media_id'] + '&h=' + res['cover_media_hash'] + '")';
			if (res['pfp_media_id'] > 0) {
				psrc = pfp_cdn + '&id=' + res['pfp_media_id'] + "&h=" + res['pfp_media_hash'];
			} else {
				if (res['user_gender'] == 'M')
					psrc = default_male_pfp;
				else if (res['user_gender'] == 'F')
					psrc = default_female_pfp;
			}
			profile_picture.src = psrc;
			birthday.value = birthdateConverter(res['user_birthdate'] * 1000);
			if(res['user_gender'] == 'F')
				femalegender.checked = true;
			else
				malegender.checked = true;
			if(res['verified'] > 0){
				switch(Number(res['verified'])){
					case 1:
						verified_text.innerText = "Standard Verified";
						break;
					case 2:
						verified_text.innerText = "Moderator Verified";
						break;
					case 20:
						verified_text.innerText = "Admin Verified";
						break;
					default:
						verified_text.innerText = "Special Verified";
						break;
				}
				verified.classList.add("fa-solid");
				verified.classList.add("fa-badge-check");
				verified.classList.add('verified_color_' + res['verified']);
			}else{
				verified_text.innerText = "Not Verified";
				verified.classList.add("fa-solid");
				verified.classList.add("fa-x");
			}
			
				
		}
	});
	changeUrlWork();
}

function _f(){
	var file_data = gebi("imagefile");
	var is_private = gebi('private').value;
	var f = new FormData();
	f.append("post", 'post');
	f.append("private", is_private);
	f.append("caption", gebtn("textarea")[0].value);
	if(file_data.files.length > 0)
		f.append("fileUpload", file_data.files[0]);
	$.ajax({
		type: "POST",
		url: "/worker/post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			if(r == "success")
				fetch_post("fetch_post.php");
		}
	});
	gebtn('body')[0].style.overflowY = "scroll";
}
function _share_feed(){
	var file_data = gebi("imagefile");
	var is_private = gebi('private').value;
	var post_id = gebi('post_id').value;
	var f = new FormData();
	f.append("post", 'post');
	f.append("private", is_private);
	f.append("post_id", post_id);
	f.append("caption", gebtn("textarea")[0].value);
	if(file_data.files.length > 0)
		f.append("fileUpload", file_data.files[0]);
	$.ajax({
		type: "POST",
		url: "/worker/share.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			var id = gebi('post_id').value;
			var splt = data.split(";");
			zTemplate(gebi("post-share-count-" + id), {
				"counter": parseInt(splt[1])
			});
			setTimeout(null,100);
			fetch_post("fetch_post.php");
		}
	});
	gebtn('body')[0].style.overflowY = "scroll";
}

function validatePost(type){
	var required = gebcn("required");
	var caption = gebtn("textarea")[0].value;
	required[0].style.display = "none";
	if(type == 0)
		_f();
	else
		_share_feed();
	gebi("imagefile").value = null;
	caption.value = '';
	gebi("imagefile").style.display = 'none';
	modal_close();
	return false;
}
function HighLightHLJS(){
	_load_hljs();
	hljs.highlightAll();
}
document.addEventListener('readystatechange', function(e){
	if(document.readyState == "complete"){
		load_lang();
		_online();
		_fr_count();
		if(gebi("online_status").value == 1)
			setInterval(_online, 300000);
		setInterval(_fr_count, 300000);
		onResizeEvent();
		changeUrlWork();
	}
});
function isMobile() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				
	return check;
};
function changeUrlWork(){
	if(isMobile()){
		var cpost_box = gebcn('createpost_box');
		if(cpost_box != null){
			if(cpost_box.length > 0){
				cpost_box[0].style.width = "90%";
				var ipb = gebcn('input_box');
				ipb[0].style.height = "80px";
				ipb[0].style.marginLeft = "88px";
				ipb[0].style.marginTop = "-90px";
				ipb[0].style.width = "88%";
				var pfp_box = gebi('pfp_box');
				pfp_box.style.height = "80px";
				pfp_box.style.width = "80px";
			}
		}
		gebcn('usernav')[0].style.fontSize = "150%";
		var container = gebcn('container');
		if(container != null){
			container[0].style.width = "100%";
		}
		gebtn('body')[0].style.zoom = "0.5";;
		gebtn('body')[0].style.fontSize = "200%";
	}
	$("a").each(function() {
		if(this.href != '' && this.className != "post-link"){
			if(!this.hasAttribute("linked")){
				this.setAttribute("linked", "true");
				this.addEventListener("click", function(e) {
					e.preventDefault();
					changeUrl(this.pathname + this.search);
				});
			}
		}
	});
}
window.addEventListener ("resize", onResizeEvent, true);
function onResizeEvent() {
	if(!isMobile()){
		var bodyElement = gebtn("BODY")[0];
		newWidth = bodyElement.offsetWidth;
		var feed = gebi('feed');
		var custom_style = gebi('custom_style');
		if(feed != null && custom_style != null) feed.style.marginTop = "-230px";
		if(custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:20% !important;}</style>";
		if(newWidth < 1708 && newWidth < 1350 && newWidth < 1670){
			if(feed != null) feed.style.marginTop = "0px";
		}else if(newWidth >= 1350 && newWidth < 1708 && newWidth < 1670){
			if(custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:5% !important;}</style>";
		}else if(newWidth >= 1350 && newWidth < 1708 && newWidth >= 1670){
			if(custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:15% !important;}</style>";
		}
	}
}
function isBottom() {
	var calc = $(window).scrollTop()*2.15 + $(window).height() > $(document).height() - 200;
	return calc;
}
$(window).scroll(function() {
	var u = window.location.pathname;
	if($(window).height() != $(document).height()){
		if((($(window).scrollTop() + $(window).height() > $(document).height() - 100) && !isMobile()) || (isBottom() && isMobile())) {
			if ((u === "/home.php" || u === "home.php") || (u.substring(0,12) === "/profile.php" || u.substring(0,11) === "profile.php")){
				var page = gebi('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					if (u.substring(0,12) === "/profile.php" || u.substring(0,11) === "profile.php"){
						var add_header = "";
						if(u.substring(0,16) === "/profile.php?id=" || u.substring(0,15) === "profile.php?id=")
							add_header = "&id=" + get("id");
						fetch_post("fetch_profile_post.php?page=" + nextPage + add_header);
					}else{
						fetch_post("fetch_post.php?page=" + nextPage);
					}
					page.value = nextPage;
				}
			} else if(u === "/friends.php" || u === "friends.php"){
				var page = gebi('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					fetch_friend_list('fetch_friend_list.php?page=' + nextPage);
					page.value = nextPage;
				}
			}else if(u === "/requests.php" || u === "requests.php"){
				var page = gebi('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					fetch_friend_request('fetch_friend_request.php?page=' + nextPage);
					page.value = nextPage;
				}
			}
		}
	}
});