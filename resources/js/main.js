function preview(input){
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (event){
			var match = reader.result.match(/^data:([^/]+)\/([^;]+);/) || [];
			var type = match[1];
			var format = match[2];
			$('#preview_' + type).css('display', 'initial');
			if(type == 'video'){
				var video = document.getElementById("preview_video");
				video.setAttribute('src', event.target.result);
				video.setAttribute('type', type + '/' + format);
			}else{
				$('#preview_' + type).attr('src', event.target.result);
			}
		}
		reader.readAsDataURL(input.files[0]);
	}
}
function make_blob_url(content, format){
	var blob = new Blob([content], { type: format });
	var blobUrl = URL.createObjectURL(blob);
	return blobUrl;
}
function load_video(i, h, f, e){
	var url = 'data/videos.php?t=media&id=' + i + '&h=' + h;
	console.log("Saved url=" + url + " format=" + f);
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
					xhr.responseType = 'blob';
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
	var path = document.getElementById("selectedFile").value;
	path = path.replace(/^.*\\/, "");
	document.getElementById("path").innerHTML = path;
}
function validateNumber(){
	var number = document.getElementById("phonenum").value;
	var required = document.getElementsByClassName("required");
	if(number == ""){
		required[0].innerHTML = "You must type Your Number.";
		return false;
	} else if(isNaN(number)){
		required[0].innerHTML = "Phone Number must contain digits only."
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
function timeConverter(UNIX_timestamp){
	var a = new Date(UNIX_timestamp);
	var year = a.getFullYear();
	var month = a.getMonth() + 1;
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec ;
	return time;
}
function birthdateConverter(UNIX_timestamp){
	var a = new Date(UNIX_timestamp);
	var year = a.getFullYear();
	var month = a.getMonth() + 1;
	if(month.toString().length == 1)
		month = '0' + month;
	var date = a.getDate();
	var time = year + '-' + month + '-' + date;
	return time;
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
		var post_like = document.getElementById("post-like-" + id);
		var class_l = "icon-heart fa-heart icon-click";
		if (splt[0] === "1") {
			post_like.className = class_l + " fa-solid p-heart";
			post_like.classList.toggle("active");
		} else {
			post_like.className = class_l + " fa-regular white-col";
		}
		zTemplate(document.getElementById("post-like-count-" + id), {
			"counter": parseInt(splt[1])
		});
	});
}
function loading_bar(percent){
	document.getElementById("loading_bar").style.width = percent + "%";
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
$(window).on("popstate", function (event, state) {
	var url = new URL(window.location.href);
	var urlPath = url.pathname + url.search;
	if(localStorage.getItem("cgurl") == 0)
		changeUrl(urlPath);
});
function fetch_pfp_box(){
	$.get("worker/profile_image.php", function(data) {
		var pfp_box = document.getElementById('pfp_box');
		if(pfp_box != null){
			if (data['pfp_media_id'] > 0) {
				pfp_box.src = 'data/images.php?t=profile&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'];
			} else {
				if (data['user_gender'] == 'M')
					pfp_box.src = 'data/images.php?t=default_M';
				else if (data['user_gender'] == 'F')
					pfp_box.src = 'data/images.php?t=default_F';
			}
		}
	});
}
function fetch_post(loc) {
	fetch_pfp_box();
	$.get("worker/" + loc, function(data) {
		var post_feed = '';
		var post_length = Object.keys(data).length;
		var page = document.getElementById('page');
		var end_of_page = false;
		if (data["success"] == 1) {
			for (let i = 0; i < (post_length - 1); i++) {
				var post_adata = data[i];
				var share_id = 0;
				var share_able = true;
				var post_a = "";
				post_a += '<div class="post" id="post_id-' + post_adata['post_id'] + '">';
				post_a += '<div class="header">';
				if (post_adata['pfp_media_id'] > 0) {
					post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + post_adata['pfp_media_id'] + "&h=" + post_adata['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (post_adata['user_gender'] == 'M')
						post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
					else if (post_adata['user_gender'] == 'F')
						post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
				}
				post_a += '<a class="fname profilelink" href="profile.php?id=' + post_adata['user_id'] + '">' + post_adata['user_firstname'] + ' ' + post_adata['user_lastname'];
				if(post_adata['verified'] > 0)
					post_a += '<i class="fa-solid fa-badge-check verified_color_' + post_adata['verified'] + '" title="verified"></i>';
				post_a += '<span class="nickname">@' + post_adata['user_nickname'] + '</span>';
				post_a += '</a>';
				post_a += '<a class="public">';
				post_a += '<span class="postedtime" title="' + timeConverter(post_adata['post_time'] * 1000) + '">';
				switch(Number(post_adata['post_public'])){
					case 2:
						post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
						break;
					case 1:
						post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
						break;
					default:
						post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
						break;
				}
				post_a += " " + timeSince(post_adata['post_time'] * 1000) + '</span>';;
				post_a += '</a>';
				post_a += '</div>';
				post_a += '<br>';
				if (post_adata['post_media'] != 0) {
					if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['post_caption'].length > 1196){
						post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
						post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
					}else{
						post_a += '<div class="caption_box" style="height: 100%">';
					}
					post_a += '<pre class="caption">' + post_adata['post_caption'] + '</pre></div>';
					post_a += '<center>';
					if(post_adata['is_video'])
						post_a += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + post_adata['post_id'] + '" controls></video>';
					else
						post_a += '<img src="' + "data/images.php?t=media&id=" + post_adata['post_media'] + "&h=" + post_adata['media_hash'] + '" style="max-width:100%;">';
					post_a += '<br><br>';
					post_a += '</center>';
				} else {
					if(post_adata['is_share'] == 0 && post_adata['post_caption'].replace(/^\s+|\s+$/gm,'').length < 20){
						post_a += '<center>';
						if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 3){
							post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
							post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
						}else{
							post_a += '<div class="caption_box" style="height: 100%">';
						}
						post_a += '<pre class="caption" style="font-size: 300%">' + post_adata['post_caption'] + '</pre></div>';
						post_a += '</center>';
					}else{
						if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['post_caption'].length > 1196){
							post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
							post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
						}else{
							post_a += '<div class="caption_box" style="height: 100%">';
						}
						post_a += '<pre class="caption">' + post_adata['post_caption'] + '</pre></div>';
					}
				}
				post_a += '<br>';

				if (post_adata['is_share'] != 0) {
					var pflag = false;
					pflag = post_adata['share']["pflag"];
					post_a += '<div class="share-post" id="post_id-' + post_adata['share']['post_id'] + '">';
					if (pflag) {
						post_a += '<div class="header">';

						if (post_adata['share']['pfp_media_id'] > 0) {
							post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + post_adata['share']['pfp_media_id'] + "&h=" + post_adata['share']['pfp_media_hash'] + '" width="40px" height="40px">';
						} else {
							if (post_adata['share']['user_gender'] == 'M')
								post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
							else if (post_adata['share']['user_gender'] == 'F')
								post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
						}

						post_a += '<a class="fname profilelink" href="profile.php?id=' + post_adata['share']['user_id'] + '">' + post_adata['share']['user_firstname'] + ' ' + post_adata['share']['user_lastname'];
						if(post_adata['share']['verified'] > 0)
							post_a += '<i class="fa-solid fa-badge-check verified_color_' + post_adata['share']['verified'] + '" title="verified"></i>';
						post_a += '<span class="nickname">@' + post_adata['share']['user_nickname'] + '</span>';
						post_a += '</a>';
						post_a += '<a class="public">';
						post_a += '<span class="postedtime" title="' + timeConverter(post_adata['share']['post_time'] * 1000) + '">';
						if (post_adata['share']['post_public'] == 2) {
							post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
						} else if (post_adata['share']['post_public'] == 1) {
							post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
						} else {
							post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
						}
						post_a += " " + timeSince(post_adata['share']['post_time'] * 1000) + '</span>';;
						post_a += '</a>';
						post_a += '<br>';
						post_a += '</div>';
						if (post_adata['post_media'] !== 0) {
							if(post_adata['share']['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['share']['post_caption'].length > 1196){
								post_a += '<div class="caption_box" id="caption_box-'+post_adata['is_share']+'shd">';
								post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['is_share']+'shd"><p onclick="showMore(\''+post_adata['is_share']+'shd\')">Show more</p></div>';
							}else{
								post_a += '<div class="caption_box" style="height: 100%">';
							}
							post_a += '<pre class="caption">' + post_adata['share']['post_caption'] + '</pre></div>';

							post_a += '<center>';
							if(post_adata['share']['is_video'])
								post_a += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + post_adata['share']['post_id'] + 's" controls></video>';
							else
								post_a += '<img src="' + "data/images.php?t=media&id=" + post_adata['share']['post_media'] + "&h=" + post_adata['share']['media_hash'] + '" style="max-width:100%;">';
							post_a += '<br><br>';
							post_a += '</center>';
						} else {
							post_a += '<center>';
							if(post_adata['share']['post_caption'].split(/\r\n|\r|\n/).length > 3 || post_adata['share']['post_caption'].length > 60){
								post_a += '<div class="caption_box" id="caption_box-'+post_adata['is_share']+'shd">';
								post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['is_share']+'shd"><p onclick="showMore(\''+post_adata['is_share']+'shd\')">Show more</p></div>';
							}else{
								post_a += '<div class="caption_box" style="height: 100%">';
							}
							post_a += '<pre class="caption" style="font-size: 300%">' + post_adata['share']['post_caption'] + '</pre></div>';
							post_a += '</center>';
						}
						post_a += '<br>';

					} else {
						share_able = false;
						post_a += '<p style="font-size: 150%;text-align: center">Cant display this post </p>';
					}
					post_a += '</div>';
					share_id = post_adata['is_share'];
				}else{
					share_id = post_adata['post_id'];
				}

				post_a += '<div class="bottom">';
				post_a += '<div class="reaction-bottom">';
				var liked = '';
				if (post_adata['is_liked'] == 1)
					liked = 'p-heart fa-solid';
				else
					liked = 'white-col fa-regular';

				post_a += '<div class="reaction-box likes">';
				post_a += '<i onclick="_like(' + post_adata['post_id'] + ')" class="' + liked + ' icon-heart fa-heart icon-click" id="post-like-' + post_adata['post_id'] + '"></i>';
				post_a += ' <a z-var="counter call roller" id="post-like-count-' + post_adata['post_id'] + '">' + post_adata['total_like'] + '</a>';
				post_a += '</div>';

				post_a += '<div class="reaction-box comment">';
				post_a += '<i onclick="_open_post(' + post_adata['post_id'] + ')" class="fa-regular fa-comment icon-click" id="post-comment-' + post_adata['post_id'] + '"></i>';
				post_a += ' <a z-var="counter call roller" id="post-comment-count-' + post_adata['post_id'] + '">' + post_adata['total_comment'] + '</a>';
				post_a += '</div>';
				if(share_able){
					post_a += '<div class="reaction-box share">';
					post_a += '<i onclick="_share(' + share_id + ')" class="fa-regular fa-share icon-click" id="post-share-' + post_adata['post_id'] + '"></i>';
					post_a += ' <a z-var="counter call roller" id="post-share-count-' + post_adata['post_id'] + '">' + post_adata['total_share'] + '</a>';
					post_a += '</div>';
				}

				post_a += '</div>';
				post_a += '</div>';
				post_a += '</div>';
				post_a += '</br>';
				post_feed += post_a;
			}
		} else {
			end_of_page = true;
			post_feed += '<div class="post">';
			post_feed += '<h1>Nothing new yet...</h1>';
			post_feed += '</div>';
		}
		if(page.value != -1){
			if(end_of_page)
				 page.value = -1;
			document.getElementById("feed").innerHTML += post_feed;
			
			for (let i = 0; i < (post_length - 1); i++) {
				var post_adata = data[i];
				var _pvideo = document.getElementById("video_pid-" + post_adata['post_id']);
				var _psvideo = document.getElementById("video_pid-" + post_adata['post_id'] + 's');
				if(_pvideo != null)
					load_video(post_adata['post_media'], post_adata['media_hash'], post_adata['media_format'], _pvideo);
				if(_psvideo != null)
					load_video(post_adata['share']['post_media'], post_adata['share']['media_hash'], post_adata['share']['media_format'], _psvideo);
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
function get(name){
	if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
}
function processAjaxData(response, urlPath) {
	var el = document.createElement("html");
	el.innerHTML = response;
	var container = el.getElementsByClassName('container');
	var style = el.getElementsByTagName('style');
	var docStyle = document.getElementsByTagName('style');
	var docHead = document.getElementsByTagName('head');
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
	document.getElementsByClassName('container')[0].innerHTML = container[0].innerHTML;
	var title = $(response).filter('title').text();
	document.title = title;
	window.history.pushState({
		"html": response,
		"pageTitle": title
	}, "", urlPath);
	loading_bar(0);
	if (urlPath.substring(0,13) === "/settings.php" || urlPath.substring(0,12) === "settings.php")
		_load_settings();
	if (urlPath === "/home.php" || urlPath === "home.php")
		fetch_post("fetch_post.php");
	if (urlPath === "/logout.php" || urlPath === "logout.php")
		location.reload();
	if (urlPath === "/friends.php" || urlPath === "friends.php")
		fetch_friend_list('fetch_friend_list.php');
	if (urlPath === "/requests.php" || urlPath === "requests.php")
		fetch_friend_request('fetch_friend_request.php');
	if (urlPath.substring(0,12) === "/profile.php" || urlPath.substring(0,11) === "profile.php"){
		var add_header = "";
		if(urlPath.substring(0,16) === "/profile.php?id=" || urlPath.substring(0,15) === "profile.php?id=")
			add_header = "?id=" + get("id");
		fetch_profile("fetch_profile_info.php" + add_header);
		fetch_post("fetch_profile_post.php" + add_header);
	}
	if (urlPath.substring(0,9) === "/post.php" || urlPath.substring(0,8) === "post.php"){
		if(urlPath.substring(0,13) === "/post.php?id=" || urlPath.substring(0,12) === "post.php?id=")
			_load_post(get("id"));
		else
			window.history.go(-1);
	}
	changeUrlWork();
}
function modal_close() {
	document.getElementById("modal").style.display = "none";
	document.getElementsByTagName('body')[0].style.overflowY = "scroll";
}
function _load_comment(id, page){
	$.get("worker/fetch_comment.php?id=" + id + "&page=" + page, function(data) {
		var cmt_box = document.getElementById("comment-box");
		var cmt_a = '';
		if(data['success'] == 2)
			document.getElementById('page').value = -1;
		if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				cmt_a += '<div class="comment">';
				if (data[i]['pfp_media_id'] > 0) {
					cmt_a += '<img class="pfp comment-pfp" src="' + "data/images.php?t=profile&id=" + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (data[i]['user_gender'] == 'M')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
					else if (data[i]['user_gender'] == 'F')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
				}
				cmt_a += '<a class="profilelink cmt_user_name" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0)
					cmt_a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="verified"></i>';
				cmt_a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				cmt_a += '</a>';
				cmt_a += '<span class="cmt_postedtime" title="' + timeConverter(data[i]['comment_time'] * 1000) + '">' + timeSince(data[i]['comment_time'] * 1000) + '</span>';
				cmt_a += '<pre class="comment-text">' + data[i]['comment'] + '</pre>';
				cmt_a += '</div>';
				cmt_a += '<hr/>';
			}
		}
		cmt_box.innerHTML += cmt_a;
		cmt_box.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 55) + "px";
		changeUrlWork();
	});
}
function _share(id) {
	document.getElementsByTagName('body')[0].style.overflowY = "hidden";
	$.get("worker/fetch_post_info.php?id=" + id, function(data) {
		document.getElementById("modal").style.display = "block";
		var post_adata = data;
		var post_a = "";
		
		post_a += '	<div class="createpost_box">';
		post_a += '		<div>';
		post_a += '		<br>';
		post_a += '		<br>';
		post_a += '			<span style="float:right; color:black">';
		post_a += '			<input type="hidden" name="post_id" id="post_id" value="'+post_adata['post_id']+'">';
		post_a += '			<select name="private" id="private">';
		post_a += '				<option value="2">public</option>';
		post_a += '				<option value="1">friend</option>';
		post_a += '				<option value="0">private</option>';
		post_a += '			</select>';
		post_a += '			</span>';
		post_a += '			<img class="pfp" src="' + document.getElementById('pfp_box').src + '" width="40px" height="40px"><a class="fname">' + document.getElementById('fullname').value + "</a>";
		post_a += '			<span class="required" style="display:none;"> *You can\'t Leave the Caption Empty.</span><br>';
		post_a += '			<textarea rows="6" name="caption" class="caption" placeholder="Write something..."></textarea>';
		post_a += '			<center><img src="" id="preview_image" style="max-width:100%; display:none;"><video id="preview_video" style="max-width:100%; display:none;"></video></center>';
		post_a += '			<div class="createpostbuttons">';
		post_a += '				<label>';
		post_a += '					<i class="fa-regular fa-image"></i>';
		post_a += '					<input type="file" name="fileUpload" id="imagefile">';
		post_a += '				</label>';
		post_a += '				<input type="button" value="Share" name="post" onclick="return validatePost(1)">';
		post_a += '			</div>';
		post_a += '		</div>';
		post_a += '		<br>';
		
		post_a += '<div class="post">';
		post_a += document.getElementById("post_id-" + id).innerHTML;
		post_a += '</div>';
		
		document.getElementById("modal_content").innerHTML = post_a;
		
		$(document).ready(function(){
				$('#imagefile').change(function(){
					preview(this);
				});
			});
		var textarea = document.getElementsByTagName("textarea")[0];
		textarea.oninput = function() {
			textarea.style.height = "";
			textarea.style.height = Math.min(textarea.scrollHeight, 1280) + "px";
		};
	});
}
function make_post(){
	document.getElementsByTagName('body')[0].style.overflowY = "hidden";
	document.getElementById("modal").style.display = "block";
	var post_a = "";
	post_a += '	<div class="createpost_box">';
	post_a += '		<div>';
	post_a += '		<br>';
	post_a += '		<br>';
	post_a += '			<h2>Make Post</h2>';
	post_a += '			<hr>';
	post_a += '			<span style="float:right; color:black">';
	post_a += '			<select name="private" id="private">';
	post_a += '				<option value="2">public</option>';
	post_a += '				<option value="1">friend</option>';
	post_a += '				<option value="0">private</option>';
	post_a += '			</select>';
	post_a += '			</span>';
	post_a += '			<img class="pfp" src="' + document.getElementById('pfp_box').src + '" width="40px" height="40px"><a class="fname">' + document.getElementById('fullname').value + "</a>";
	post_a += '			<span class="required" style="display:none;"> *You can\'t Leave the Caption Empty.</span><br>';
	post_a += '			<textarea rows="6" name="caption" class="caption" placeholder="Write something..."></textarea>';
	post_a += '			<center><img src="" id="preview_image" style="max-width:100%; display:none;"><video id="preview_video" style="max-width:100%; display:none;"></video></center>';
	post_a += '			<div class="createpostbuttons">';
	post_a += '				<label>';
	post_a += '					<i class="fa-regular fa-image"></i>';
	post_a += '					<input type="file" accept="image/*,video/*" name="fileUpload" id="imagefile">';
	post_a += '				</label>';
	post_a += '				<input type="button" value="Post" name="post" onclick="return validatePost(0)">';
	post_a += '			</div>';
	post_a += '		</div>';
	post_a += '	</div>';
	document.getElementById("modal_content").innerHTML = post_a;
	$(document).ready(function(){
			$('#imagefile').change(function(){
				preview(this);
			});
		});
	var textarea = document.getElementsByTagName("textarea")[0];
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
		var friend_list = document.getElementById("friend_list");
		var frl_a = '';
		frl_a += '<center>';
		if(data['success'] == 2){
			frl_a += '<div class="post">';
			frl_a += 'You don\'t yet have any friends.';
			frl_a += '</div>';
		} else if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				frl_a += '<div class="frame">';
				frl_a += '<center>';
				frl_a += '<div class="pfp-box">';
				if(data[i]['pfp_media_id'] > 0) {
					frl_a += '<img class="pfp" src="data/images.php?t=profile&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="168px" height="168px"	id="pfp"/>';
				} else {
					if(data[i]['user_gender'] == 'M')
						frl_a += '<img class="pfp" src="data/images.php?t=default_M" width="168px" height="168px" id="pfp"/>';
					else if (data[i]['user_gender'] == 'F')
						frl_a += '<img class="pfp" src="data/images.php?t=default_F" width="168px" height="168px" id="pfp"/>';
				}
				frl_a += '<div class="status-circle ' + ( (data[i]['is_online']) ? 'online' : 'offline') + '-status-circle"></div>';
				frl_a += '</div>';
				frl_a += '<br>';
				frl_a += '<a class="flist_link" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0)
					frl_a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="verified"></i>'; 
				frl_a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				frl_a += '</a>';
				frl_a += '</center>';
				frl_a += '</div>';
			}
		}
			
		frl_a += '</center>';
		friend_list.innerHTML += frl_a;
		changeUrlWork();
	});
}
function fetch_friend_request(loc){
	$.get("worker/" + loc, function(data) {
		var friend_reqest_list = document.getElementById("friend_reqest_list");
		var frl_a = '';
		frl_a += '<center>';
		if(data['success'] == 2){
			frl_a += '<div class="userquery">';
			frl_a += 'You have no pending friend requests.';
			frl_a += '<br><br>';
			frl_a += '</div>';
		}else if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				frl_a += '<div class="userquery">';
				if(data[i]['pfp_media_id'] > 0) {
					frl_a += '<img class="pfp" src="data/images.php?t=profile&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="168px" height="168px"	id="pfp"/>';
				} else {
					if(data[i]['user_gender'] == 'M')
						frl_a += '<img class="pfp" src="data/images.php?t=default_M" width="168px" height="168px" id="pfp"/>';
					else if (data['user_gender'] == 'F')
						frl_a += '<img class="pfp" src="data/images.php?t=default_F" width="168px" height="168px"	id="pfp"/>';
				}
				frl_a += '<br>';
				frl_a += '<a class="profilelink" href="profile.php?id=' + data[i]['user_id'] +'">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0) 
					frl_a += '<i class="fa-solid fa-badge-check verified_color_'+data[i]['verified']+'" title="verified"></i>';
				frl_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
				frl_a += '<a>';
				frl_a += '<div id="toggle-fr-' + data[i]['user_id'] + '">';
				frl_a += '<input type="submit" value="Accept" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',1)" name="accept">';
				frl_a += '<br><br>';
				frl_a += '<input type="submit" value="Ignore" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',0)" name="ignore">';
				frl_a += '<br><br>';
				frl_a +='</div>';
				frl_a += '</div>';
				frl_a += '<br>';
			}
		}
			
		frl_a += '</center>';
		friend_reqest_list.innerHTML += frl_a;
		changeUrlWork();
	});
}
function fetch_profile(loc){
	$.get("worker/" + loc, function(data) {
		if(data['success'] != 1) 
			window.history.go(-1);
		var profile = document.getElementById("profile");
		var profile_cover = document.getElementById("profile_cover");
		var pfp_a = '';
		pfp_a += '<center>';
		pfp_a += '<div class="profile_head">';
		if(data['pfp_media_id'] > 0) {
			pfp_a += '<img class="pfp" src="data/images.php?t=profile&id=' + data['pfp_media_id'] + '&h=' + data['pfp_media_hash'] + '" width="200px" height="200px"	id="pfp"/>';
		} else {
			if(data['user_gender'] == 'M')
				pfp_a += '<img class="pfp" src="data/images.php?t=default_M" width="200px" height="200px" id="pfp"/>';
			else if (data['user_gender'] == 'F')
				pfp_a += '<img class="pfp" src="data/images.php?t=default_F" width="200px" height="200px"	id="pfp"/>';
		}
		if(data['cover_media_id'] > 0)
			profile_cover.style.backgroundImage = 'url("data/images.php?t=profile&id=' + data['cover_media_id'] + '&h=' + data['cover_media_hash'] + '")';
		
		pfp_a += "<div class='user_name'>";
		pfp_a += data['user_firstname'] + ' ' + data['user_lastname'];
		
		if(data['verified'] > 0)
			pfp_a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="verified"></i>';
		pfp_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
		pfp_a += "</div>";
		pfp_a += '</div>';
		pfp_a += '<br>';
		pfp_a += '<br>';
		pfp_a += '<div class="about_me">';
		if(data['user_about'] != ''){
			pfp_a += '<h2>About me:</h2>';
			pfp_a += data['user_about'];
		}
		pfp_a += '<br>';
		pfp_a += '<br>';
		pfp_a += '<br>';
		if(data['user_gender'] == "M")
			pfp_a += 'Male';
		else if(data['user_gender'] == "F")
			pfp_a += 'Female';
		pfp_a += '<br>';
		if(data['user_status'] != ''){
			switch(data['user_status']){
				case "S":
					pfp_a += 'Single';
					break;
				case "E":
					pfp_a += 'Engaged';
					break;
				case "M":
					pfp_a += 'Married';
					break;
				case "L":
					pfp_a += 'In Love';
					break;
				default:
				case "U":
					pfp_a += 'Unknown';
					break;
			}
			pfp_a += '<br>';
		}
		pfp_a += birthdateConverter(data['user_birthdate'] * 1000);
		if(data['user_hometown'] == ''){
			pfp_a += '<br>';
			pfp_a += data['user_hometown'];
		}
		if(data['flag'] == 1){
			pfp_a += '<br>';
			if(data['friendship_status'] != null) {
				pfp_a += '<div>';
				pfp_a += (data['friendship_status'] == 1) ? '<input type="submit" onclick="_friend_toggle()" value="Friends" name="remove" id="special" class="fr_button">' : '<input type="submit" onclick="_friend_toggle()" value="Request Pending" name="remove" id="special" class="fr_button">';
				pfp_a += '</div>';
			} else {
				pfp_a += '<div>';
				pfp_a += '<input type="submit" onclick="_friend_toggle()" value="Send Friend Request" name="request" id="special" class="fr_button">';
				pfp_a += '</div>';
			}
		}
		pfp_a += '</center>';
		profile.innerHTML = pfp_a;
		if(isMobile()){
			var pfp_head = document.getElementsByClassName('profile_head')[0];
			var user_name = document.getElementsByClassName('user_name')[0];
			var about_me = document.getElementsByClassName('about_me')[0];
			var nickname = document.getElementsByClassName('nickname')[0];
			var feed = document.getElementById('feed');
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
		var _content_left = document.getElementById("_content_left");
		var _content_right = document.getElementById("_content_right");
		var post_a = '';
		post_a += '<div class="rcf_box"></div>';
		post_a += '<div class="header" style="margin: 15px">';
		document.getElementById("_content_left").style.height = ($(window).height() - 45) + "px";
		_content_right.style.height = ($(window).height() - 45) + "px";
		if(data['post_media'] > 0 || data['is_share'] > 0){
			var picture = document.getElementById("picture");
			var video = document.getElementById("video");
			if(data['is_share'] > 0){
				post_a += '<a style="text-align: center;" href="post.php?id='+data['is_share'] +'">View original post</a>';
				post_a += '<hr>';
				if(data['share']['is_video']){
					video.setAttribute('src', "data/empty.mp4");
					video.setAttribute('type', "video/mp4");
					video.setAttribute('id', data['share']['media_hash']);
					load_video(data['share']['post_media'],data['share']['media_hash'],data['share']['media_format'],document.getElementById(data['media_hash']));
					picture.style.display = 'none';
				}else{
					picture.src = "data/images.php?t=media&id=" + data['share']['post_media'] + "&h=" + data['share']['media_hash'];
					video.style.display = 'none';
				}
			}else{
				if(data['is_video']){
					video.setAttribute('src', "data/empty.mp4");
					video.setAttribute('type', "video/mp4");
					video.setAttribute('id', data['media_hash']);
					load_video(data['post_media'],data['media_hash'],data['media_format'],document.getElementById(data['media_hash']));
					picture.style.display = 'none';
				}else{
					picture.src = "data/images.php?t=media&id=" + data['post_media'] + "&h=" + data['media_hash'];
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
			post_a += '<style>.caption_box{overflow-y: auto;}.caption_box_shadow{margin-top:540px;width:99%;}.comment-form{width: calc(80% - 10px);}</style>';
		}
		if (data['pfp_media_id'] > 0) {
			post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] + '" width="40px" height="40px">';
		} else {
			if (data['user_gender'] == 'M')
				post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
			else if (data['user_gender'] == 'F')
				post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
		}
		post_a += '<a class="fname profilelink" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
		if(data['verified'] > 0)
			post_a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="verified"></i>';
		post_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
		post_a += '</a>';
		post_a += '<a class="public">';
		post_a += '<span class="postedtime" title="' + timeConverter(data['post_time'] * 1000) + '">';
		switch(Number(data['post_public'])){
			case 2:
				post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
				break;
			case 1:
				post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
				break;
			default:
				post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
				break;
		}
		post_a += " " + timeSince(data['post_time'] * 1000) + '</span>';
		post_a += '</a>';
		post_a += '</div>';
		post_a += '<br>';
		if(data['post_caption'].split(/\r\n|\r|\n/).length > 13 || data['post_caption'].length > 1196){
			post_a += '<div class="caption_box" id="caption_box-'+data['post_id']+'">';
			post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+data['post_id']+'"><p onclick="showMore(\''+data['post_id']+'\')">Show more</p></div>';
		}else{
			post_a += '<div class="caption_box">';
		}
		post_a += '<pre class="caption">' + data['post_caption'] + '</pre></div>';
		
		post_a += '<hr />';
		post_a += '<div class="comment-box" id="comment-box">';
		post_a += '</div>';
		post_a += '<div class="comment-form">';
		post_a += '<textarea class="comment-form-text" placeholder="Comment something..." id="comment-form-text"></textarea>';
		post_a += '<div class="send-btn" onclick="send_comment()"><i class="fa-solid fa-paper-plane-top"></i></div>';
		post_a += '</div>';
		
		_content_right.innerHTML = post_a;
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
			document.getElementsByClassName('comment-form')[0].style.width = "100%";
		}
		$("#comment-box").scroll(function() {
			var obj = this;
			if(obj.scrollTop === (obj.scrollHeight - obj.offsetHeight)){
				var page = document.getElementById('page');
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
			var tgf = document.getElementById('toggle-fr-' + data['id']);
			var tgf_a = '';
			tgf_a += '<center>';
			tgf_a += 'accepted';
			tgf_a += '</center>';
			tgf.innerHTML = tgf_a;
		}
	});
}
function send_comment(){
	var text = document.getElementById("comment-form-text").value;
	var form_data = new FormData();
	form_data.append('comment', text);
	$.ajax({
		type: "POST",
		url: "/worker/comment.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			$.get("worker/fetch_profile_info.php", function(data) {
				var cmt_box = document.getElementById('comment-box');
				var cmt_a = '';
				cmt_a += '<div class="comment">';
				if (data['pfp_media_id'] > 0) {
					cmt_a += '<img class="pfp comment-pfp" src="' + "data/images.php?t=profile&id=" + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (data['user_gender'] == 'M')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
					else if (data['user_gender'] == 'F')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
				}
				cmt_a += '<a class="profilelink cmt_user_name" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
				if(data['verified'] > 0)
					cmt_a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="verified"></i>';
				cmt_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
				cmt_a += '</a>';
				cmt_a += '<span class="cmt_postedtime" title="' + timeConverter(Date.now()) + '">' + timeSince(Date.now()) + '</span>';
				cmt_a += '<pre class="comment-text">' + document.getElementById("comment-form-text").value + '</pre>';
				cmt_a += '</div>';
				cmt_a += '<hr/>';
				cmt_box.innerHTML = cmt_box.innerHTML + cmt_a;
				document.getElementById("comment-form-text").value = '';
				cmt_box.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 55) + "px";
				changeUrlWork();
			});
		}
	});
}
function _friend_toggle(){
	var special = document.getElementById("special");
	var form_data = new FormData();
	form_data.append(special.name, '1');
	$.ajax({
		type: "POST",
		url: "/worker/friend_toggle.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			var special = document.getElementById("special");
			if(special.name == "request"){
				special.name = "remove";
				special.value = "Request Pending";
			}else{
				special.name = "request";
				special.value = "Send Friend Request";
			}
		}
	});
}
function showMore(id){
	var cap = document.getElementById('caption_box-' + id);
	cap.style.height = (cap.children[1].clientHeight + 15) + "px";
	document.getElementById('caption_box_shadow-' + id).style.display = "none";
}
function _online(){
	$.ajax({
		url: "/worker/online.php",
		type: 'GET'
	});
	changeUrlWork();
}
function _fr_count(){
	$.ajax({
		url: "/worker/friend_request_count.php",
		type: 'GET',
		success: function(res) {
			document.getElementById('friend_req_count').innerHTML = res;
		}
	});
}
function _load_hljs(){
	$.ajax({
		url: "/worker/hljs_lang_list.php",
		type: 'GET',
		success: function(res) {
			var hljs_lang_list= document.getElementById('hljs_lang_list');
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
	var current_tab = document.getElementById('tab-' + tab);
	if(current_tab != null)
		current_tab.classList.add("active");
	var current_setting_tab = document.getElementById('setting-tab-' + tab);
	if(current_setting_tab != null)
		current_setting_tab.style.display = "block";
	$.ajax({
		url: "/worker/fetch_profile_setting_info.php",
		type: 'GET',
		success: function(res) {
			var usernickname = document.getElementById('usernickname');
			var userfirstname = document.getElementById('userfirstname');
			var userlastname = document.getElementById('userlastname');
			var malegender = document.getElementById('malegender');
			var femalegender = document.getElementById('femalegender');
			var email = document.getElementById('email');
			var user_hometown = document.getElementById('userhometown');
			var user_about = document.getElementById('userabout');
			var verified = document.getElementById('verified');
			var verified_text = document.getElementById('verified-text');
			var birthday = document.getElementById('birthday');
			var profile_picture = document.getElementById('profile_picture');
			var setting_profile_cover = document.getElementById('setting_profile_cover');
			var psrc = '';
			user_about.value = res['user_about'];
			user_hometown.value = res['user_hometown'];
			usernickname.value = res['user_nickname'];
			userfirstname.value = res['user_firstname'];
			userlastname.value = res['user_lastname'];
			email.value = res['user_email'];
			if(res['cover_media_id'] > 0)
				setting_profile_cover.style.backgroundImage = 'url("data/images.php?t=profile&id=' + res['cover_media_id'] + '&h=' + res['cover_media_hash'] + '")';
			if (res['pfp_media_id'] > 0) {
				psrc = 'data/images.php?t=profile&id=' + res['pfp_media_id'] + "&h=" + res['pfp_media_hash'];
			} else {
				if (res['user_gender'] == 'M')
					psrc = 'data/images.php?t=default_M';
				else if (res['user_gender'] == 'F')
					psrc = 'data/images.php?t=default_F';
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

function _post_feed(){
	var file_data = document.getElementById("imagefile");
	var is_private = document.getElementById('private').value;
	var form_data = new FormData();
	form_data.append("post", 'post');
	form_data.append("private", is_private);
	form_data.append("caption", document.getElementsByTagName("textarea")[0].value);
	if(file_data.files.length > 0)
		form_data.append("fileUpload", file_data.files[0]);
	$.ajax({
		type: "POST",
		url: "/worker/post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			if(response == "success")
				fetch_post("fetch_post.php");
		}
	});
	document.getElementsByTagName('body')[0].style.overflowY = "scroll";
}
function _share_feed(){
	var file_data = document.getElementById("imagefile");
	var is_private = document.getElementById('private').value;
	var post_id = document.getElementById('post_id').value;
	var form_data = new FormData();
	form_data.append("post", 'post');
	form_data.append("private", is_private);
	form_data.append("post_id", post_id);
	form_data.append("caption", document.getElementsByTagName("textarea")[0].value);
	if(file_data.files.length > 0)
		form_data.append("fileUpload", file_data.files[0]);
	$.ajax({
		type: "POST",
		url: "/worker/share.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			var id = document.getElementById('post_id').value;
			var splt = data.split(";");
			zTemplate(document.getElementById("post-share-count-" + id), {
				"counter": parseInt(splt[1])
			});
			setTimeout(null,100);
			fetch_post("fetch_post.php");
		}
	});
	document.getElementsByTagName('body')[0].style.overflowY = "scroll";
}

function validatePost(type){
	var required = document.getElementsByClassName("required");
	var caption = document.getElementsByTagName("textarea")[0].value;
	required[0].style.display = "none";
	if(type == 0)
		_post_feed();
	else
		_share_feed();
	document.getElementById("imagefile").value = null;
	caption.value = '';
	document.getElementById("imagefile").style.display = 'none';
	modal_close();
	return false;
}
function HighLightHLJS(){
	_load_hljs();
	hljs.highlightAll();
}
document.addEventListener('readystatechange', function(e){
	if(document.readyState == "complete"){
		_online();
		_fr_count();
		if(document.getElementById("online_status").value == 1)
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
		var cpost_box = document.getElementsByClassName('createpost_box');
		if(cpost_box != null){
			if(cpost_box.length > 0){
				cpost_box[0].style.width = "90%";
				var ipb = document.getElementsByClassName('input_box');
				ipb[0].style.height = "80px";
				ipb[0].style.marginLeft = "88px";
				ipb[0].style.marginTop = "-90px";
				ipb[0].style.width = "88%";
				var pfp_box = document.getElementById('pfp_box');
				pfp_box.style.height = "80px";
				pfp_box.style.width = "80px";
			}
		}
		document.getElementsByClassName('usernav')[0].style.fontSize = "150%";
		var container = document.getElementsByClassName('container');
		if(container != null){
			container[0].style.width = "100%";
		}
		document.getElementsByTagName('body')[0].style.zoom = "0.5";;
		document.getElementsByTagName('body')[0].style.fontSize = "200%";
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
		var bodyElement = document.getElementsByTagName("BODY")[0];
		newWidth = bodyElement.offsetWidth;
		var feed = document.getElementById('feed');
		var custom_style = document.getElementById('custom_style');
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
	var urlPath = window.location.pathname;
	if($(window).height() != $(document).height()){
		if((($(window).scrollTop() + $(window).height() > $(document).height() - 100) && !isMobile()) || (isBottom() && isMobile())) {
			if ((urlPath === "/home.php" || urlPath === "home.php") || (urlPath.substring(0,12) === "/profile.php" || urlPath.substring(0,11) === "profile.php")){
				var page = document.getElementById('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					if (urlPath.substring(0,12) === "/profile.php" || urlPath.substring(0,11) === "profile.php"){
						var add_header = "";
						if(urlPath.substring(0,16) === "/profile.php?id=" || urlPath.substring(0,15) === "profile.php?id=")
							add_header = "&id=" + get("id");
						fetch_post("fetch_profile_post.php?page=" + nextPage + add_header);
					}else{
						fetch_post("fetch_post.php?page=" + nextPage);
					}
					page.value = nextPage;
				}
			} else if(urlPath === "/friends.php" || urlPath === "friends.php"){
				var page = document.getElementById('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					fetch_friend_list('fetch_friend_list.php?page=' + nextPage);
					page.value = nextPage;
				}
			}else if(urlPath === "/requests.php" || urlPath === "requests.php"){
				var page = document.getElementById('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					fetch_friend_request('fetch_friend_request.php?page=' + nextPage);
					page.value = nextPage;
				}
			}
		}
	}
});
