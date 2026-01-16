default_male_pfp = 'data/images.php?t=default_M';
default_female_pfp = 'data/images.php?t=default_F';
default_user_pfp = 'data/images.php?t=default_U';
pfp_cdn = 'data/images.php?t=profile';
media_cdn = 'data/images.php?t=media';
video_cdn = 'data/videos.php?t=media';
backend_url = "/worker/";
supported_language = [['en-us', 'English'], ['vi-vn', 'Tiếng Việt']];

if (typeof (Storage) !== "undefined") {
	a = lsg("language");
	d = lsg("language_data");
	h = lsg("load_hightlightjs");
	if (a == null) {
		lss("language", 'en-us');
		a = 'en-us';
	}
	if (h == null) {
		lss("load_hightlightjs", 'yes');
		h = "yes";
	}
	if (d == null) {
		$.ajaxSetup({ async: false });
		$.get("resources/language/" + a + ".json", function (r) {
			lss("language_data", JSON.stringify(r));
			d = JSON.stringify(r);
		}).done(function () {
			location.reload();
		});
		$.ajaxSetup({ async: true });
	}
	j = JSON.parse(d);
	Object.keys(j).forEach(function (v) {
		window[v] = j[v];
	});
}
function getCFToken() {
	return document.querySelector("[name='cf-turnstile-response']").value;
}
function toggeHLJS() {
	if (h == "yes") {
		lss("load_hightlightjs", 'no');
		h = "no";
		return;
	}
	lss("load_hightlightjs", 'yes');
	h = "yes";
}
function changeLanguage(lang = 'en-us') {
	localStorage.setItem("language", lang);
	$.get("resources/language/" + lang + ".json", function (r) {
		lss("language_data", JSON.stringify(r));
		d = JSON.stringify(r);
	}).done(function () {
		location.reload();
	});
}
function getDefaultUserImage(g) {
	switch (g) {
		case "M":
			return default_male_pfp;
		case "F":
			return default_female_pfp;
		case "U":
		default:
			return default_user_pfp;
	}
}
function in_array(a, s) {
	return a.includes(s);
}
function round_number(n) {
	s = '';
	r = n;
	f = false;
	if (n > 1000 && n < 999999) {
		r = n / 1000;
		s = 'K';
		f = true;
	}
	if (n > 999999 && n < 999999999) {
		r = n / 1000;
		s = 'M';
		f = true;
	}
	return ((f) ? Number((r).toFixed(1)) : r) + s;
}
function load_lang() {
	i = gebtn('lang');
	Object.keys(i).forEach(function (n) {
		e = i[n];
		s = e.getAttribute('lang');
		if (e.getAttribute('lang_set') != 'true') {
			t = e.tagName.toLocaleLowerCase();
			l = window[s];
			switch (t) {
				case 'input':
					a = e.getAttribute('type');
					if (a == 'submit' || a == 'button') {
						e.value = l;
					} else {
						e.placeholder = l;
					}
					break;
			}
			e.innerHTML = l;
			e.setAttribute('lang_set', 'true');
		}
	});
	h = gebtn('input');
	Object.keys(h).forEach(function (n) {
		e = h[n];
		s = e.getAttribute('lang');
		if (e.getAttribute('lang_set') != 'true' && s != null) {
			l = window[s];
			a = e.getAttribute('type');
			if (a == 'submit' || a == 'button')
				e.value = l;
			else
				e.placeholder = l;
			e.setAttribute('lang_set', 'true');
		}
	});
}
function lsg(n) {
	return localStorage.getItem(n);
}
function lss(n, v) {
	return localStorage.setItem(n, v);
}
function gebi(i) {
	return document.getElementById(i);
}
function gebcn(i) {
	return document.getElementsByClassName(i);
}
function gebtn(i) {
	return document.getElementsByTagName(i);
}
function gebiwe(e, i) {
	return e.querySelectorAll('#' + i)[0];
}
function gebcnwe(e, i) {
	return e.getElementsByClassName(i);
}
function preview(input) {
	if (input.files && input.files[0]) {
		r = new FileReader();
		r.onload = function (e) {
			m = r.result.match(/^data:([^/]+)\/([^;]+);/) || [];
			t = m[1];
			f = m[2];
			$('#preview_' + t).css('display', 'initial');
			if (t == 'video') {
				v = gebi("preview_video");
				v.setAttribute('src', e.target.result);
				v.setAttribute('type', t + '/' + f);
			} else {
				$('#preview_' + t).attr('src', e.target.result);
			}
		}
		r.readAsDataURL(input.files[0]);
	}
}
function make_blob_url(c, f) {
	b = new Blob([c], { type: f });
	u = URL.createObjectURL(b);
	return u;
}
function load_video(i, h, f, e) {
	u = video_cdn + '&id=' + i + '&h=' + h;
	$.ajax({
		type: "HEAD",
		async: true,
		url: u,
	}).done(function (ms, tx, h) {
		s = Number(h.getResponseHeader('Content-Length'));
		if (s > 33554432) {
			e.setAttribute("src", u);
		} else {
			$.ajax({
				xhr: function () {
					x = new XMLHttpRequest();
					x.rType = 'blob';
					return x;
				},
				url: u,
				type: 'GET',
				async: true,
				success: function (r) {
					b = make_blob_url(r, f);
					e.setAttribute("src", b);
				}
			});
		}
	});
}
function showPath() {
	p = gebi("selectedFile").value;
	p = p.replace(/^.*\\/, "");
	gebi("path").innerHTML = p;
}
function validateNumber() {
	n = gebi("phonenum").value;
	r = gebcn("required");
	if (n == "") {
		r[0].innerHTML = window["lang__007"];
		return false;
	} else if (isNaN(n)) {
		r[0].innerHTML = window["lang__008"];
		return false;
	}
	return true;
}
function textAreaRework() {
	$("textarea").each(function () {
		this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
	}).on("input", function () {
		this.style.height = 0;
		this.style.height = (this.scrollHeight) + "px";
	});
}
function timeConverter(t) {
	a = new Date(t);
	y = a.getFullYear();
	m = a.getMonth() + 1;
	d = a.getDate();
	h = a.getHours();
	i = a.getMinutes();
	s = a.getSeconds();
	r = d + '/' + m + '/' + y + ' ' + h + ':' + i + ':' + s;
	return r;
}
function birthdateConverter(t) {
	a = new Date(t);
	y = a.getFullYear();
	m = a.getMonth() + 1;
	if (m.toString().length == 1)
		m = '0' + m;
	d = a.getDate();
	if (d.toString().length == 1)
		d = '0' + d;
	r = y + '-' + m + '-' + d;
	return r;
}
function timeSince(d) {
	s = Math.floor((new Date() - d) / 1000);
	i = s / 31536000;
	if (i > 1)
		return Math.floor(i) + " y";
	i = s / 2592000;
	if (i > 1)
		return Math.floor(i) + " m";
	i = s / 86400;
	if (i > 1)
		return Math.floor(i) + " d";
	i = s / 3600;
	if (i > 1)
		return Math.floor(i) + " hr";
	i = s / 60;
	if (i > 1)
		return Math.floor(i) + " min";
	return Math.floor(s) + " seconds";
}
function _load_info() {
	$.ajax({
		url: backend_url + "fetch_profile_setting_info.php",
		type: 'GET',
		success: function (res) {
			gebi('online_status').value = res['online_status'];
			gebi('fullname').value = res['user_firstname'] + ' ' + res['user_lastname'];
		}
	});
}
function _like(id) {
	$.get(backend_url + "likes.php?post_id=" + id, function (d) {
		s = d.split(";");
		l = gebi("post-like-" + id);
		c = "icon-heart fa-heart icon-click";
		if (s[0] === "1") {
			l.className = c + " fa-solid p-heart";
			l.classList.toggle("active");
		} else {
			l.className = c + " fa-regular white-col";
		}
		zTemplate(gebi("post-like-count-" + id), {
			"counter": parseInt(s[1])
		});
	});
}
function loading_bar(percent) {
	gebi("loading_bar").style.width = percent + "%";
}
lss("cgurl", 0);
function changeUrl(u) {
	window.scrollTo({ top: 0, behavior: 'smooth' });
	lss("cgurl", 1);
	loading_bar(70)
	$.ajax({
		url: u,
		type: 'GET',
		success: function (r) {
			_online();
			loading_bar(100)
			processAjaxData(r, u);
			_load_info();
			onResizeEvent();
			lss("cgurl", 0);
		},
		error: function () {
			lss("cgurl", 0);
		}
	});
}
function processAjaxData(r, u) {
	e = document.createElement("html");
	e.innerHTML = r;
	tl = e.getElementsByTagName('title')[0].innerHTML;
	c = e.getElementsByClassName('container');
	s = e.getElementsByTagName('style');
	d = gebtn('style');
	h = gebtn('head');
	if (s.length > 0) {
		if (d.length == 0) {
			n = document.createElement("style");
			n.innerHTML = s[0].innerHTML;
			h[0].appendChild(n);
		} else {
			d[0].innerHTML = s[0].innerHTML;
		}
	} else {
		if (d.length > 0) {
			d[0].innerHTML = '';
		}
	}
	if (u.substring(0, 12) === "/profile.php" || u.substring(0, 11) === "profile.php") {
		window['xel'] = e;
		fetch_profile(e);
		gebcn('container')[0].innerHTML = c[0].innerHTML;
	} else {
		gebcn('container')[0].innerHTML = c[0].innerHTML;
	}
	load_lang();
	document.title = tl;
	window.history.pushState({
		"html": r,
		"pageTitle": tl
	}, "", u);
	loading_bar(0);
	if (u.substring(0, 13) === "/settings.php" || u.substring(0, 12) === "settings.php")
		_load_settings();
	if (u === "/home.php" || u === "home.php")
		fetch_post("fetch_post.php");
	if (u === "/logout.php" || u === "logout.php")
		location.reload();
	if (u === "/friends.php" || u === "friends.php")
		fetch_friend_list('fetch_friend_list.php');
	if (u === "/requests.php" || u === "requests.php")
		fetch_friend_request('fetch_friend_request.php');
	if (u === "/notification.php" || u === "notification.php")
		loadNotifications();
	if (u.substring(0, 9) === "/post.php" || u.substring(0, 8) === "post.php") {
		if (u.substring(0, 13) === "/post.php?id=" || u.substring(0, 12) === "post.php?id=")
			_load_post(get("id"));
		else
			window.history.go(-1);
	}
	changeUrlWork();
	textAreaRework();
	updateActiveNavbar(u);
}

function updateActiveNavbar(u) {
	// Normalize URL path (remove queries for matching base page)
	// Handle cases like /profile.php?id=1 -> /profile.php
	// But /home.php is distinct

	// Create a dummy anchor to parse the full URL 'u' if it's relative or absolute
	var parser = document.createElement('a');
	parser.href = u;
	var path = parser.pathname;

	// Ensure path starts with /
	if (path.charAt(0) !== "/") path = "/" + path;

	var links = document.querySelectorAll(".usernav a");
	links.forEach(function (link) {
		link.classList.remove("active");
		var linkPath = new URL(link.href).pathname; // Get absolute path of link and extract pathname

		if (linkPath === path) {
			link.classList.add("active");
		}
	});
}
$(window).on("popstate", function () {
	url = new URL(window.location.href);
	u = url.pathname + url.search;
	if (lsg("cgurl") == 0)
		changeUrl(u);
});
function fetch_pfp_box() {
	if (typeof (Storage) !== "undefined") {
		b = gebi('pfp_box');
		if (b != null) {
			i = lsg('pfp_media_id');
			h = lsg('pfp_media_hash');
			g = lsg('user_gender');
			$.get(backend_url + "profile_image.php", function (d) {
				if (d["pfp_media_id"] != i) lss("pfp_media_id", d["pfp_media_id"]);
				if (d["pfp_media_hash"] != h) lss("pfp_media_hash", d["pfp_media_hash"]);
				if (d["user_gender"] != g) lss("user_gender", d["user_gender"]);
			});
			b.src = (i > 0) ? pfp_cdn + '&id=' + (i != null ? i : lsg('pfp_media_id')) + "&h=" + (h != null ? h : lsg('pfp_media_hash')) : getDefaultUserImage((g != null ? g : lsg('user_gender')));
		}
	}
}
function fetch_post(loc, from_blob = false) {
	fetch_pfp_box();
	$.get((from_blob ? '' : backend_url) + loc, function (data) {
		f = '';
		l = Object.keys(data).length;
		page = gebi('page');
		e = false;
		if (data["success"] == 1) {
			for (let i = 0; i < (l - 1); i++) {
				var s = data[i];
				share_id = 0;
				share_able = true;
				a = "";
				a += '<div class="post" id="post_id-' + s['post_id'] + '">';
				a += '<div class="header">';
				a += '<img class="pfp" src="';
				a += (s['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + s['pfp_media_id'] + "&h=" + s['pfp_media_hash'] : getDefaultUserImage(s['user_gender']);
				a += '" width="40px" height="40px">';

				a += '<div class="header-info">'; // Wrapper

				// User Name Line
				a += '<div class="user_name">';
				a += '<a class="profilelink" href="profile.php?id=' + s['user_id'] + '">' + s['user_firstname'] + ' ' + s['user_lastname'] + '</a>';
				if (s['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + s['verified'] + '" style="margin-left:5px;" title="' + window["lang__016"] + '"></i>';
				a += '</div>';

				// Meta Line (Nickname • Time • Privacy)
				a += '<div class="postedtime">';
				a += '<span class="nickname">@' + s['user_nickname'] + '</span>';
				a += ' • ';
				a += '<span title="' + timeConverter(s['post_time'] * 1000) + '">' + timeSince(s['post_time'] * 1000) + '</span>';
				a += ' • ';
				switch (Number(s['post_public'])) {
					case 2:
						a += '<i class="fa-solid fa-earth-americas" title="' + window["lang__002"] + '"></i>';
						break;
					case 1:
						a += '<i class="fa-solid fa-user-group" title="' + window["lang__004"] + '"></i>';
						break;
					default:
						a += '<i class="fa-solid fa-lock" title="' + window["lang__003"] + '"></i>';
						break;
				}
				a += '</div>'; // End Meta

				a += '</div>'; // End header-info
				a += '</div>'; // End header
				a += '<br>';
				if (s['post_media'] != 0 || (s['post_media_list'] && s['post_media_list'].length > 0)) {
					if (s['post_caption'].split(/\r\n|\r|\n/).length > 13 || s['post_caption'].length > 1196) {
						a += '<div class="caption_box" id="caption_box-' + s['post_id'] + '">';
						a += '<div class="caption_box_shadow" id="caption_box_shadow-' + s['post_id'] + '"><p onclick="showMore(\'' + s['post_id'] + '\')">' + window["lang__014"] + '</p></div>';
					} else {
						a += '<div class="caption_box" style="height: 100%">';
					}
					a += '<pre class="caption">' + s['post_caption'] + '</pre></div>';

					// CAROUSEL / MEDIA RENDER
					if (s['post_media_list']) {
						a += renderMedia(s['post_media_list']);
					} else if (s['post_media'] != 0) {
						// Fallback for legacy or if list empty but single media exists
						a += '<center>';
						if (s['is_video'])
							a += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + s['post_id'] + '" controls></video>';
						else
							a += '<img src="' + media_cdn + "&id=" + s['post_media'] + "&h=" + s['media_hash'] + '" style="max-width:100%;">';
						a += '</center>';
					}
					a += '<br><br>';
				} else {
					if (s['is_share'] == 0 && s['post_caption'].replace(/^\s+|\s+$/gm, '').length < 20) {
						a += '<center>';
						if (s['post_caption'].split(/\r\n|\r|\n/).length > 3) {
							a += '<div class="caption_box" id="caption_box-' + s['post_id'] + '">';
							a += '<div class="caption_box_shadow" id="caption_box_shadow-' + s['post_id'] + '"><p onclick="showMore(\'' + s['post_id'] + '\')">' + window["lang__014"] + '</p></div>';
						} else {
							a += '<div class="caption_box" style="height: 100%">';
						}
						a += '<pre class="caption" style="font-size: 300%">' + s['post_caption'] + '</pre></div>';
						a += '</center>';
					} else {
						if (s['post_caption'].split(/\r\n|\r|\n/).length > 13 || s['post_caption'].length > 1196) {
							a += '<div class="caption_box" id="caption_box-' + s['post_id'] + '">';
							a += '<div class="caption_box_shadow" id="caption_box_shadow-' + s['post_id'] + '"><p onclick="showMore(\'' + s['post_id'] + '\')">' + window["lang__014"] + '</p></div>';
						} else {
							a += '<div class="caption_box" style="height: 100%">';
						}
						a += '<pre class="caption">' + s['post_caption'] + '</pre></div>';
					}
				}
				a += '<br>';
				if (s['is_share'] != 0) {
					pflag = false;
					pflag = s['share']["pflag"];
					a += '<div class="share-post" id="post_id-' + s['share']['post_id'] + '">';
					if (pflag) {
						a += '<div class="header">';
						a += '<img class="pfp" src="'
						a += (s['share']['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + s['share']['pfp_media_id'] + "&h=" + s['share']['pfp_media_hash'] : getDefaultUserImage(s['share']['user_gender']);
						a += '" width="40px" height="40px">';

						a += '<div class="header-info">'; // Wrapper

						// User Name
						a += '<div class="user_name">';
						a += '<a class="profilelink" href="profile.php?id=' + s['share']['user_id'] + '">' + s['share']['user_firstname'] + ' ' + s['share']['user_lastname'] + '</a>';
						if (s['share']['verified'] > 0)
							a += '<i class="fa-solid fa-badge-check verified_color_' + s['share']['verified'] + '" style="margin-left:5px;" title="' + window["lang__016"] + '"></i>';
						a += '</div>';

						// Meta
						a += '<div class="postedtime">';
						a += '<span class="nickname">@' + s['share']['user_nickname'] + '</span>';
						a += ' • ';
						a += '<span title="' + timeConverter(s['share']['post_time'] * 1000) + '">' + timeSince(s['share']['post_time'] * 1000) + '</span>';
						a += ' • ';
						if (s['share']['post_public'] == 2) {
							a += '<i class="fa-solid fa-earth-americas" title="' + window["lang__002"] + '"></i>';
						} else if (s['share']['post_public'] == 1) {
							a += '<i class="fa-solid fa-user-group" title="' + window["lang__004"] + '"></i>';
						} else {
							a += '<i class="fa-solid fa-lock" title="' + window["lang__003"] + '"></i>';
						}
						a += '</div>'; // End Meta

						a += '</div>'; // End header-info
						a += '</div>'; // End header
						// Removed dangling code
						a += '<br>';
						a += '</div>';
						if (s['post_media'] !== 0) {
							if (s['share']['post_caption'].split(/\r\n|\r|\n/).length > 13 || s['share']['post_caption'].length > 1196) {
								a += '<div class="caption_box" id="caption_box-' + s['is_share'] + 'shd">';
								a += '<div class="caption_box_shadow" id="caption_box_shadow-' + s['is_share'] + 'shd"><p onclick="showMore(\'' + s['is_share'] + 'shd\')">' + window["lang__014"] + '</p></div>';
							} else {
								a += '<div class="caption_box" style="height: 100%">';
							}
							a += '<pre class="caption">' + s['share']['post_caption'] + '</pre></div>';

							a += '<center>';
							if (s['share']['is_video'])
								a += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + s['share']['post_id'] + 's" controls></video>';
							else
								a += '<img src="' + media_cdn + "&id=" + s['share']['post_media'] + "&h=" + s['share']['media_hash'] + '" style="max-width:100%;">';
							a += '<br><br>';
							a += '</center>';
						} else {
							a += '<center>';
							if (s['share']['post_caption'].split(/\r\n|\r|\n/).length > 3 || s['share']['post_caption'].length > 60) {
								a += '<div class="caption_box" id="caption_box-' + s['is_share'] + 'shd">';
								a += '<div class="caption_box_shadow" id="caption_box_shadow-' + s['is_share'] + 'shd"><p onclick="showMore(\'' + s['is_share'] + 'shd\')">' + window["lang__014"] + '</p></div>';
							} else {
								a += '<div class="caption_box" style="height: 100%">';
							}
							a += '<pre class="caption" style="font-size: 300%">' + s['share']['post_caption'] + '</pre></div>';
							a += '</center>';
						}
						a += '<br>';

					} else {
						share_able = false;
						a += '<p style="font-size: 150%;text-align: center">' + window["lang__013"] + '</p>';
					}
					a += '</div>';
					share_id = s['is_share'];
				} else {
					share_id = s['post_id'];
				}

				a += '<div class="bottom">';
				a += '<div class="reaction-bottom">';
				liked = '';
				if (s['is_liked'] == 1)
					liked = 'p-heart fa-solid';
				else
					liked = 'white-col fa-regular';

				a += '<div class="reaction-box likes" onclick="_like(' + s['post_id'] + ')">';
				a += '<i class="' + liked + ' icon-heart fa-heart icon-click" id="post-like-' + s['post_id'] + '"></i>';
				a += ' <a z-var="counter call roller" id="post-like-count-' + s['post_id'] + '">' + s['total_like'] + '</a>';
				a += '</div>';

				a += '<div class="reaction-box comment" onclick="_open_post(' + s['post_id'] + ')">';
				a += '<i class="fa-regular fa-comment icon-click" id="post-comment-' + s['post_id'] + '"></i>';
				a += ' <a z-var="counter call roller" id="post-comment-count-' + s['post_id'] + '">' + s['total_comment'] + '</a>';
				a += '</div>';
				if (share_able) {
					a += '<div class="reaction-box share" onclick="_share(' + share_id + ')">';
					a += '<i class="fa-regular fa-share icon-click" id="post-share-' + s['post_id'] + '"></i>';
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
			f += '<h1>' + window["lang__012"] + '</h1>';
			f += '</div>';
		}
		if (page.value != -1) {
			if (e)
				page.value = -1;
			gebi("feed").innerHTML += f;

			for (let i = 0; i < (l - 1); i++) {
				s = data[i];
				_pvideo = gebi("video_pid-" + s['post_id']);
				_psvideo = gebi("video_pid-" + s['post_id'] + 's');
				if (_pvideo != null)
					load_video(s['post_media'], s['media_hash'], s['media_format'], _pvideo);
				if (_psvideo != null)
					load_video(s['share']['post_media'], s['share']['media_hash'], s['share']['media_format'], _psvideo);
			}
			HighLightHLJS();
		}
		if (isMobile()) {
			$(".post").each(function () {
				this.style.border = "none";
				this.style.borderLeft = "none";
				this.style.borderRight = "none";
				this.style.width = "100%";
				this.style.marginRight = "0";
			});
			$(".header .pfp").each(function () {
				this.style.height = "80px";
				this.style.width = "80px";
			});
			$(".postedtime").each(function () {
				this.style.marginLeft = "85px";
			});
			$(".caption_box_shadow").each(function () {
				this.style.width = "calc(97.9%)";
			});
			$(".fname").each(function () {
				this.style.marginTop = "-85px";
				this.style.marginLeft = "85px";
			});
			$("pre.caption").each(function () {
				this.style.width = "calc(97.9%)";
			});
		}
		changeUrlWork();
	});
}
function get(n) {
	if (n = (new RegExp('[?&]' + encodeURIComponent(n) + '=([^&]*)')).exec(location.search))
		return decodeURIComponent(n[1]);
}
// Add click outside listener
if (gebi("modal")) {
	gebi("modal").onclick = function (e) {
		if (e.target == gebi("modal")) {
			modal_close();
		}
	}
}


function modal_close() {
	gebi("modal").style.display = "none";
	gebtn('body')[0].style.overflowY = "scroll";
}

function modal_open(type, pid = null) {
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "flex";

	var content = gebi("modal_content");
	content.innerHTML = '<div class="upload-modal-container"><div class="upload-modal-body"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div></div>'; // Loading state

	if (type === 'view_post' && pid) {
		var a = '';
		a += '<div class="post-view-modal">';
		a += '  <div class="post-view-left" id="_content_left"></div>';
		a += '  <div class="post-view-right" id="_content_right">';
		a += '    <i class="fa-solid fa-xmark close-modal-btn post-view-close" onclick="modal_close()"></i>';
		a += '  </div>';
		a += '</div>';
		content.innerHTML = a;

		var container = gebi("modal-content");
		if (container) {
			container.style.maxWidth = "none";
			container.style.width = "auto";
			container.style.margin = "0";
			container.style.padding = "0";
			container.style.background = "transparent";
			container.style.border = "none";
			container.style.boxShadow = "none";
			var closeBtn = container.querySelector('.close');
			if (closeBtn) closeBtn.style.display = 'none';
		}

		// Reset modal styles
		content.style.padding = "0";
		content.style.background = "transparent";
		content.style.boxShadow = "none";
		content.style.maxWidth = "min(1200px, 95vw)";
		content.style.width = "100%";

		_load_post(pid);
	} else if (type === 'settings') {
		// Fetch current info to pre-fill
		$.get(backend_url + "fetch_profile_info.php", function (data) {
			if (data.success === 1) {
				var h = '';
				h += '<div class="upload-modal-container">';
				h += '<div class="upload-modal-header">';
				h += '<h2>Edit Profile</h2>';
				h += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
				h += '</div>';

				h += '<div class="upload-modal-body" style="display:block; padding:20px;">';

				// Flex row for names
				h += '<div style="display:flex; gap:15px; margin-bottom:15px;">';
				h += '<div style="flex:1;">';
				h += '<label class="input-label">First Name</label>';
				h += '<input type="text" id="userfirstname" class="index_input_box" value="' + (data.user_firstname || '') + '">';
				h += '</div>';
				h += '<div style="flex:1;">';
				h += '<label class="input-label">Last Name</label>';
				h += '<input type="text" id="userlastname" class="index_input_box" value="' + (data.user_lastname || '') + '">';
				h += '</div>';
				h += '</div>';

				// Details
				var bdayVal = data.user_birthdate;
				if (bdayVal && !isNaN(bdayVal)) {
					// Convert timestamp to YYYY-MM-DD
					var date = new Date(bdayVal * 1000);
					var day = ("0" + date.getDate()).slice(-2);
					var month = ("0" + (date.getMonth() + 1)).slice(-2);
					bdayVal = date.getFullYear() + "-" + month + "-" + day;
				}

				h += '<div style="margin-bottom:15px;">';
				h += '<label class="input-label">Bio (About)</label>';
				h += '<textarea id="userabout" class="index_input_box" style="height:80px;">' + (data.user_about || '') + '</textarea>';
				h += '</div>';

				h += '<div style="display:flex; gap:15px; margin-bottom:15px;">';
				h += '<div style="flex:1;">';
				h += '<label class="input-label">Hometown</label>';
				h += '<input type="text" id="userhometown" class="index_input_box" value="' + (data.user_hometown || '') + '">';
				h += '</div>';
				h += '<div style="flex:1;">';
				h += '<label class="input-label">Birthday</label>';
				h += '<input type="date" id="birthday" class="index_input_box" value="' + (bdayVal || '') + '">';
				h += '</div>';
				h += '</div>';

				// Gender
				h += '<div style="margin-bottom:15px;">';
				h += '<label class="input-label">Gender</label><br>';
				h += '<div style="display:flex; gap:20px; margin-top:5px;">';
				h += '<label><input type="radio" name="usergender" class="usergender" value="M" ' + (data.user_gender == 'M' ? 'checked' : '') + '> Male</label>';
				h += '<label><input type="radio" name="usergender" class="usergender" value="F" ' + (data.user_gender == 'F' ? 'checked' : '') + '> Female</label>';
				h += '<label><input type="radio" name="usergender" class="usergender" value="U" ' + (data.user_gender == 'U' ? 'checked' : '') + '> Other</label>';
				h += '</div>';
				h += '</div>';

				h += '</div>'; // End Body

				h += '<div class="upload-modal-footer">';
				h += '<button class="btn-primary" onclick="_change_profile_infomation()">Save Changes</button>';
				h += '</div>';
				h += '</div>'; // End Container

				content.innerHTML = h;

				// Reset Styles
				content.style.padding = "0";
				content.style.background = "transparent";
				content.style.boxShadow = "none";
			}
		});
	} else if (type === '2fa_setup') {
		$.get(backend_url + "2fa_setup.php", function (r) {
			if (r.success === 1) {
				var h = '';
				h += '<div class="upload-modal-container">';
				h += '<div class="upload-modal-header">';
				h += '<h2>Setup Two-Factor Authentication</h2>';
				h += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
				h += '</div>';
				h += '<div class="upload-modal-body" style="padding:30px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:20px;">';
				h += '<p style="color:var(--color-text-dim); max-width:400px; margin:0 auto;">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>';
				h += '<div style="background:white; padding:15px; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.1); line-height:0;">';
				h += '<img src="' + r.qr + '" style="width:180px; height:180px; display:block;">';
				h += '</div>';
				h += '<div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; width:100%; box-sizing:border-box;">';
				h += '<p style="font-size:0.9em; margin-bottom:8px; color:var(--color-text-dim);">Manual Key</p>';
				h += '<code style="font-size:1.4em; color:var(--color-primary); letter-spacing:2px; font-weight:bold; font-family:monospace;">' + r.secret + '</code>';
				h += '</div>';
				h += '<div style="width:100%; max-width:300px;">';
				h += '<label class="input-label" style="display:block; margin-bottom:10px;">Enter 6-digit Code</label>';
				h += '<input type="text" id="2fa_setup_code" class="index_input_box" maxlength="6" placeholder="000000" style="text-align:center; font-size:1.8em; letter-spacing:8px; border-radius:12px; height:60px;">';
				h += '</div>';
				h += '</div>';
				h += '<div class="upload-modal-footer">';
				h += '<button class="btn-primary" onclick="_setup_2fa()" style="width:100%; padding:12px 0; font-size:1.1em;">Verify and Enable</button>';
				h += '</div>';
				h += '</div>';
				content.innerHTML = h;
			}
		});
	} else if (type === '2fa_disable') {
		var h = '';
		h += '<div class="upload-modal-container">';
		h += '<div class="upload-modal-header">';
		h += '<h2>Disable Two-Factor Authentication</h2>';
		h += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
		h += '</div>';
		h += '<div class="upload-modal-body" style="padding:30px; display:flex; flex-direction:column; gap:20px;">';
		h += '<p style="color:var(--color-text-dim);">To disable 2FA, please enter your password and a current authentication code for security.</p>';
		h += '<div>';
		h += '<label class="input-label">Your Password</label>';
		h += '<input type="password" id="2fa_disable_pass" class="index_input_box" placeholder="Enter your password">';
		h += '</div>';
		h += '<div>';
		h += '<label class="input-label">6-digit Auth Code</label>';
		h += '<input type="text" id="2fa_disable_code" class="index_input_box" maxlength="6" placeholder="000000" style="text-align:center; font-size:1.4em; letter-spacing:4px;">';
		h += '</div>';
		h += '</div>';
		h += '<div class="upload-modal-footer">';
		h += '<button class="btn-primary red_alert" onclick="_disable_2fa()" style="width:100%; padding:12px 0; font-size:1.1em;">Disable 2FA</button>';
		h += '</div>';
		h += '</div>';
		content.innerHTML = h;
	} else if (type === '2fa_select') {
		const options = [
			{
				id: 'totp',
				title: 'Authenticator App',
				desc: 'Use Google Authenticator, Authy, or similar',
				icon: 'fa-mobile-screen',
				callback: "modal_open('2fa_setup')"
			},
			{
				id: 'security_key',
				title: 'Security Key',
				desc: 'Use a hardware key like YubiKey',
				icon: 'fa-key',
				callback: "_setup_security_key()"
			}
		];

		let h = `
			<div class="upload-modal-container">
				<div class="upload-modal-header">
					<h2>Setup Two-Factor Authentication</h2>
					<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>
				</div>
				<div class="twofa-select-body">
					<div class="twofa-select-text">Choose a method to secure your account:</div>
					<div class="twofa-select-options">
						${options.map(opt => `
							<div class="twofa-option-card" onclick="${opt.callback}">
								<div class="twofa-option-icon"><i class="fa-solid ${opt.icon}"></i></div>
								<div class="twofa-option-info">
									<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
										<h3>${opt.title}</h3>
										<div class="twofa-option-chevron"><i class="fa-solid fa-chevron-right"></i></div>
									</div>
									<p>${opt.desc}</p>
								</div>
							</div>
						`).join('')}
					</div>
				</div>
			</div>`;

		content.innerHTML = h;
		// Ensure modal content can expand for ultra-wide support
		const modalContent = gebi('modal-content');
		modalContent.style.maxWidth = '1200px';
		modalContent.style.width = '95%';
	}
}
function _load_comment(id, page) {
	$.get(backend_url + "fetch_comment.php?id=" + id + "&page=" + page, function (data) {
		b = gebi("comment-box");
		list = gebi("comment-list");
		lmc = gebi("load-more-comments-container");
		a = '';
		if (data['success'] == 2) {
			if (gebi('page')) gebi('page').value = -1;
			if (lmc) lmc.style.display = 'none';
			if (page == 0) {
				list.innerHTML = '<div class="empty-comments-state"><i class="fa-light fa-comments"></i><p>No comments yet. Be the first to join the conversation!</p></div>';
			}
			return;
		}

		if (data['success'] == 1) {
			var count = 0;
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				if (!data[i] || typeof data[i] !== 'object') continue;
				count++;
				a += '<div class="comment-item" style="animation-delay: ' + (i * 0.05) + 's">';
				a += '<img class="comment-pfp" src="';
				a += (data[i]['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] : getDefaultUserImage(data[i]['user_gender']);
				a += '">';

				a += '<div class="comment-bubble">';
				a += '<div class="comment-header">';
				a += '<a class="comment-user" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if (data[i]['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" style="margin-left:4px; font-size: 11px;"></i>';
				a += '</a>';
				a += '<span class="comment-time" title="' + timeConverter(data[i]['comment_time'] * 1000) + '">' + timeSince(data[i]['comment_time'] * 1000) + '</span>';
				a += '</div>';
				a += '<div class="comment-content">' + data[i]['comment'].replace(/\n/g, '<br>') + '</div>';
				a += '</div>'; // End bubble
				a += '</div>'; // End item
			}

			if (page == 0) list.innerHTML = a;
			else list.innerHTML += a;

			if (gebi('page')) gebi('page').value = page;

			// Show/Hide Load More
			if (lmc) {
				if (count >= 10) lmc.style.display = 'block';
				else lmc.style.display = 'none';
			}
		}

		changeUrlWork();
	});
}
function _share(id) {
	gebtn('body')[0].style.overflowY = "hidden";
	$.get(backend_url + "fetch_post_info.php?id=" + id, function (s) {
		gebi("modal").style.display = "block";

		// Clear DataTransfer on new share
		dt = new DataTransfer();

		a = "";
		a += '<div class="modal-box-container" style="max-width: 550px; margin: 0 auto; padding: 25px;">';
		a += '<div class="share-modal-title">Share Post</div>';

		a += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">';
		a += '<div class="modal-header-user">';
		a += '<img class="modal-user-pfp" src="' + gebi('pfp_box').src + '">';
		a += '<span class="modal-user-name">' + gebi('fullname').value + '</span>';
		a += '</div>';
		a += '<select name="private" id="private" class="modal-privacy-select">';
		a += '<option value="2">' + window["lang__002"] + '</option>';
		a += '<option value="1">' + window["lang__004"] + '</option>';
		a += '<option value="0">' + window["lang__003"] + '</option>';
		a += '</select>';
		a += '</div>';

		a += '<input type="hidden" name="post_id" id="post_id" value="' + s['post_id'] + '">';
		a += '<textarea rows="3" name="caption" class="caption" placeholder="Say something about this..." style="width:100%; border:none; background:transparent; font-size:1.1rem; resize:none; outline:none;"></textarea>';

		// Multi-upload preview for share
		a += '<div id="media-preview-container" class="media-preview-grid"></div>';

		// Original Post Preview
		a += '<div class="share-original-preview">';
		a += '<div class="share-original-header">';
		// Determine PFP for original owner
		var op_pfp = (s['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + s['pfp_media_id'] + "&h=" + s['pfp_media_hash'] : getDefaultUserImage(s['user_gender']);
		a += '<img class="share-original-pfp" src="' + op_pfp + '">';
		a += '<span class="share-original-name">' + s['user_firstname'] + ' ' + s['user_lastname'] + '</span>';
		a += '</div>';
		if (s['post_caption']) {
			a += '<div class="share-original-caption">' + s['post_caption'] + '</div>';
		}
		// If original post has media, show the first one as thumbnail
		if (s['post_media_list']) {
			var media = s['post_media_list'].split(',')[0].split(':');
			if (media.length >= 3) {
				if (media[2].startsWith('video')) {
					a += '<video class="share-original-media" src="' + media_cdn + '&id=' + media[0] + '&h=' + media[1] + '"></video>';
				} else {
					a += '<img class="share-original-media" src="' + media_cdn + '&id=' + media[0] + '&h=' + media[1] + '">';
				}
			}
		}
		a += '</div>';

		a += '<div class="createpostbuttons" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:20px;">';
		a += '<label style="cursor:pointer;">';
		a += '<i class="fa-regular fa-image" style="font-size:1.6rem; color:var(--color-primary);"></i>';
		a += '<input type="file" accept="image/*,video/*" name="fileUpload[]" id="imagefile" multiple style="display:none;">';
		a += '</label>';
		a += '<input type="button" class="btn-primary" value="Share Now" onclick="return validatePost(1)" style="padding: 10px 30px; border-radius:10px;">';
		a += '</div>';

		a += '</div>';

		gebi("modal_content").innerHTML = a;

		$(document).ready(function () {
			$('#imagefile').change(function () {
				handleFiles(this.files);
			});
		});

		textarea = gebtn("textarea")[0];
		textarea.focus();
		textarea.oninput = function () {
			textarea.style.height = "";
			textarea.style.height = Math.min(textarea.scrollHeight, 400) + "px";
		};
	});
}
// Original make_post removed (redefined below for Multi-Upload)
function _open_post(id) {
	if (isMobile()) {
		changeUrl("post.php?id=" + id);
	} else {
		modal_open('view_post', id);
	}
}
function fetch_friend_list(loc, from_blob = false) {
	$.get((from_blob ? '' : backend_url) + loc, function (data) {
		friend_list = gebi("friend_list");
		a = '';
		a += '<center>';
		if (data['success'] == 2) {
			a += '<div class="post">';
			a += window["lang__010"];
			a += '</div>';
		} else if (data['success'] == 1) {
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				a += '<div class="frame">';
				a += '<center>';
				a += '<div class="pfp-box">';
				a += '<img class="pfp" src="'
				a += (data[i]['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] : getDefaultUserImage(data[i]['user_gender']);
				a += '" width="168px" height="168px" id="pfp"/>';
				a += '<div class="status-circle ' + ((data[i]['is_online']) ? 'online' : 'offline') + '-status-circle"></div>';
				a += '</div>';
				a += '<br>';
				a += '<a class="flist_link" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if (data[i]['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="' + window["lang__016"] + '"></i>';
				a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				a += '</a>';
				a += '</center>';
				a += '</div>';
			}
		}


		a += '</center>';
		friend_list.innerHTML = ""; // Clear existing content
		friend_list.innerHTML += a;
		changeUrlWork();
	});
}
function fetch_friend_request(loc) {
	$.get(backend_url + loc, function (data) {
		friend_reqest_list = gebi("friend_reqest_list");
		a = '';
		a += '<center>'; // Keep for now, or remove if moving to grid later
		if (data['success'] == 2) {
			a += '<div class="userquery">';
			a += window["lang__011"];
			a += '<br><br>';
			a += '</div>';
		} else if (data['success'] == 1) {
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				a += '<div class="userquery">';
				a += '<img class="pfp" src="'
				a += (data[i]['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] : getDefaultUserImage(data[i]['user_gender']);
				a += '" width="40px" height="40px">';
				a += '<br>';
				a += '<a class="profilelink" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if (data[i]['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="' + window["lang__016"] + '"></i>';
				a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				a += '</a>';
				a += '<div id="toggle-fr-' + data[i]['user_id'] + '">';
				a += '<input type="submit" value="Accept" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',1)" name="accept">';
				a += '<br><br>';
				a += '<input type="submit" value="Ignore" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',0)" name="ignore">';
				a += '<br><br>';
				a += '</div>';
				a += '</div>';
				a += '<br>';
			}
		}

		a += '</center>';
		friend_reqest_list.innerHTML = a; // Cleared and set
		changeUrlWork();
	});
}
function fetch_profile(e = null) {
	// Use async for better UX and to allow DOM to update first in SPA mode
	id = get("id");
	id_a = '';
	if (typeof (id) != 'undefined')
		id_a = '?id=' + id;

	// Note: We do not modify 'e' (the temp DOM) here because we want to load data asynchronously.
	// The skeleton from profile.php will be injected by processAjaxData first.

	$.get(backend_url + "fetch_profile_info.php" + id_a, function (data) {
		if (data['success'] != 1) {
			// If user not found, maybe redirect or show error
			if (window.location.href.indexOf("profile.php") > -1) {
				// Only redirect if we are still on the profile page
				// window.history.go(-1); // Can cause loops if not careful
			}
			return;
		}

		// Find the mount point in the REAL DOM, not the detached 'e'
		// This ensures compatibility with both direct load and SPA
		var mount = gebi("profile-header-mount");

		if (!mount) {
			// Element missing (user navigated away?)
			return;
		}

		// --- Build Profile Header HTML ---
		var h = '';
		h += '<div class="profile-header-card">';

		// Cover
		var coverUrl = (data['cover_media_id'] > 0) ? pfp_cdn + '&id=' + data['cover_media_id'] + '&h=' + data['cover_media_hash'] : '';
		var coverStyle = (coverUrl != '') ? ' style="background-image: url(\'' + coverUrl + '\')"' : '';
		h += '<div class="profile-cover-banner" id="profile_cover"' + coverStyle + '>';
		if (data['flag'] == 0) { // If own profile
			h += '<div class="profile-cover-edit-btn" onclick="_change_picture(1)"><i class="fa-solid fa-camera"></i> Edit Cover</div>';
		}
		h += '</div>';

		// Info Section
		h += '<div class="profile-info-section">';

		// PFP
		h += '<div class="profile-pfp-container">';
		var pfpUrl = (data['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] : getDefaultUserImage(data['user_gender']);
		h += '<img class="profile-pfp-img" id="profile_image" src="' + pfpUrl + '">';
		if (data['flag'] == 0) {
			h += '<div class="profile-pfp-edit-btn" onclick="_change_picture(0)"><i class="fa-solid fa-camera"></i></div>';
		}
		h += '</div>';

		// Names
		h += '<div class="profile-names">';
		h += '<div class="profile-fullname">';
		h += data['user_firstname'] + ' ' + data['user_lastname'];
		if (data['verified'] > 0)
			h += ' <i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="' + window["lang__016"] + '"></i>';
		h += '</div>';
		h += '<div class="profile-username">@' + data['user_nickname'] + '</div>';
		h += '</div>';

		// Bio & Meta
		h += '<div class="profile-bio-section">';
		if (data['user_about'] != '') {
			h += '<div class="profile-bio-text">' + data['user_about'] + '</div>';
		}

		h += '<div class="profile-bio-meta">';
		// Gender
		if (data['user_gender'] == "M") h += '<span><i class="fa-solid fa-mars"></i> ' + window['lang__030'] + '</span>';
		else if (data['user_gender'] == "F") h += '<span><i class="fa-solid fa-venus"></i> ' + window['lang__031'] + '</span>';

		// Birthdate
		h += '<span><i class="fa-solid fa-cake-candles"></i> ' + birthdateConverter(data['user_birthdate'] * 1000) + '</span>';

		// Status
		if (data['user_status'] != '' && data['user_status'] != 'N') {
			var statusText = '';
			switch (data['user_status']) {
				case "S": statusText = window['lang__071']; break;
				case "E": statusText = window['lang__072']; break;
				case "M": statusText = window['lang__073']; break;
				case "L": statusText = window['lang__074']; break;
				case "D": statusText = window['lang__075']; break;
				case "U": statusText = window['lang__076']; break;
			}
			h += '<span><i class="fa-solid fa-heart"></i> ' + statusText + '</span>';
		}

		// Hometown
		if (data['user_hometown'] != '') {
			h += '<span><i class="fa-solid fa-location-dot"></i> ' + data['user_hometown'] + '</span>';
		}
		h += '</div>'; // End meta
		h += '</div>'; // End bio section

		// Stats & Actions Bar
		h += '<div class="profile-stats-bar">';

		h += '<div class="profile-stat-item">';
		h += '<span class="profile-stat-value">' + round_number(data['total_following']) + '</span>';
		h += '<span class="profile-stat-label">Following</span>';
		h += '</div>';

		h += '<div class="profile-stat-item">';
		h += '<span class="profile-stat-value">' + round_number(data['total_follower']) + '</span>';
		h += '<span class="profile-stat-label">Followers</span>';
		h += '</div>';

		h += '<div class="profile-actions-bar">';
		if (data['flag'] == 0) { // Own profile (0 = Me)
			// Edit and Settings buttons
			h += '<button class="btn-primary" onclick="modal_open(\'settings\')"><i class="fa-solid fa-pen"></i> Edit Profile</button>';
		} else {
			// Friend Button
			if (data['friendship_status'] != null) {
				var btnTxt = (data['friendship_status'] == 1) ? 'Friends' : window["lang__005"]; // 005 = Requested?
				h += '<input type="submit" onclick="_friend_toggle()" value="' + btnTxt + '" name="remove" id="special" class="createpost_box .input_box" style="background:var(--color-primary); color:white; border:none; border-radius:5px; padding:10px 20px; cursor:pointer;">';
			} else {
				h += '<input type="submit" onclick="_friend_toggle()" value="' + window["lang__006"] + '" name="request" id="special" class="createpost_box .input_box" style="background:var(--color-surface-hover); color:white; border:1px solid var(--color-border); border-radius:5px; padding:10px 20px; cursor:pointer;">';
			}

			// Follow Button
			if (data['is_followed'] < 2) {
				var followTxt = ((data['is_followed'] == 0) ? window["lang__082"] : window["lang__083"]);
				var followName = ((data['is_followed'] == 0) ? 'f' : 'u');
				var followStyle = (data['is_followed'] == 0) ? 'background:var(--color-primary);' : 'background:transparent; border:1px solid var(--color-border);';
				h += '<input type="button" onclick="_follow_toggle()" value="' + followTxt + '" name="' + followName + '" id="follow" style="' + followStyle + ' color:white; border-radius:5px; padding:10px 20px; cursor:pointer; border:none;">';
			}
		}
		h += '</div>'; // End Actions

		h += '</div>'; // End Stats Bar

		h += '</div>'; // End Info Section
		h += '</div>'; // End Card

		mount.innerHTML = h;

		changeUrlWork();
		onResizeEvent();
	});

	// Fetch posts asynchronously as well
	fetch_post("fetch_profile_post.php" + id_a);
}
function _load_post(post_id = null) {
	id = (post_id != null) ? post_id : get('id');
	$.get(backend_url + "fetch_post_info.php?id=" + id, function (data) {
		if (data['success'] == 2)
			return;
		_content_left = gebi("_content_left");
		_content_right = gebi("_content_right");
		a = '';
		a += '<div class="rcf_box"></div>';
		a += '<div class="header" style="margin: 15px">';
		if (_content_left) _content_left.style.height = ($(window).height() - 45) + "px";
		if (_content_right) _content_right.style.height = ($(window).height() - 45) + "px";

		if (data['post_media_list'] || data['post_media'] != 0 || data['is_share'] > 0) {
			if (_content_left) {
				if (data['is_share'] > 0) {
					if (data['share']['post_media_list']) {
						_content_left.innerHTML = renderMedia(data['share']['post_media_list']);
					} else if (data['share']['post_media'] != 0) {
						_content_left.innerHTML = renderMedia(data['share']['post_media'] + ":" + data['share']['media_hash'] + ":" + data['share']['media_format']);
					} else {
						_content_left.style.display = 'none';
					}
				} else {
					if (data['post_media_list']) {
						_content_left.innerHTML = renderMedia(data['post_media_list']);
					} else if (data['post_media'] != 0) {
						_content_left.innerHTML = renderMedia(data['post_media'] + ":" + data['media_hash'] + ":" + data['media_format']);
					}
				}
			}
			if (data['is_share'] > 0) {
				a += '<a style="text-align: center; display:block; margin-bottom:10px;" href="post.php?id=' + data['is_share'] + '">View original post</a>';
				a += '<hr>';
			}
		} else {
			if (_content_left) _content_left.style.display = 'none';
			if (_content_right) {
				_content_right.style.float = 'unset';
				_content_right.style.right = 'unset';
				_content_right.style.width = '80%';
				_content_right.style.margin = 'auto';
				_content_right.style.position = 'relative';
			}
			a += '<style>.caption_box{overflow-y: auto;}.caption_box_shadow{margin-top:540px;width:99%;}.comment-form{width: calc(80% - 10px);}</style>';
		}
		a += '<img class="pfp" src="';
		a += (data['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] : ((data['user_gender'] == 'M') ? default_male_pfp : default_female_pfp);
		a += '" width="40px" height="40px">';

		a += '<div class="header-info">';
		a += '  <div class="user_name">';
		a += '    <a class="profilelink" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'] + '</a>';
		if (data['verified'] > 0)
			a += '    <i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="' + window["lang__016"] + '"></i>';
		a += '  </div>';

		a += '  <div class="postedtime">';
		a += '    <span class="nickname">@' + data['user_nickname'] + '</span>';
		a += '    • ';
		a += '    <span title="' + timeConverter(data['post_time'] * 1000) + '">' + timeSince(data['post_time'] * 1000) + '</span>';
		a += '    • ';
		switch (Number(data['post_public'])) {
			case 2:
				a += '    <i class="fa-solid fa-earth-americas" title="' + window["lang__002"] + '"></i>';
				break;
			case 1:
				a += '    <i class="fa-solid fa-user-group" title="' + window["lang__004"] + '"></i>';
				break;
			default:
				a += '    <i class="fa-solid fa-lock" title="' + window["lang__003"] + '"></i>';
				break;
		}
		a += '  </div>';
		a += '</div>'; // End header-info
		a += '</div>'; // End header

		// INTERACTION BAR
		a += '<div class="post-detail-interaction-bar">';
		liked = (data['is_liked'] == 1) ? 'p-heart fa-solid' : 'white-col fa-regular';
		a += '  <div class="interaction-item" onclick="_like(' + data['post_id'] + ')">';
		a += '    <i class="' + liked + ' fa-heart" id="post-like-' + data['post_id'] + '"></i>';
		a += '    <span class="interaction-label">Like</span>';
		a += '    <span class="interaction-count" id="post-like-count-' + data['post_id'] + '">' + data['total_like'] + '</span>';
		a += '  </div>';

		a += '  <div class="interaction-item" onclick="gebi(\'comment-form-text\').focus()">';
		a += '    <i class="fa-regular fa-comment"></i>';
		a += '    <span class="interaction-label">Comment</span>';
		a += '    <span class="interaction-count" id="post-comment-count-' + data['post_id'] + '">' + data['total_comment'] + '</span>';
		a += '  </div>';

		a += '  <div class="interaction-item" onclick="_share(' + data['post_id'] + ')">';
		a += '    <i class="fa-regular fa-share"></i>';
		a += '    <span class="interaction-label">Share</span>';
		a += '    <span class="interaction-count" id="post-share-count-' + data['post_id'] + '">' + data['total_share'] + '</span>';
		a += '  </div>';
		a += '</div>';

		a += '<br>';
		if (data['post_caption'].split(/\r\n|\r|\n/).length > 13 || data['post_caption'].length > 1196) {
			a += '<div class="caption_box" id="caption_box-' + data['post_id'] + '">';
			a += '<div class="caption_box_shadow" id="caption_box_shadow-' + data['post_id'] + '"><p onclick="showMore(\'' + data['post_id'] + '\')">' + window["lang__014"] + '</p></div>';
		} else {
			a += '<div class="caption_box">';
		}
		a += '<pre class="caption">' + data['post_caption'] + '</pre></div>';

		a += '<hr />';
		a += '<div class="comment-box" id="comment-box">';
		a += '  <div id="comment-list"></div>';
		a += '  <div id="load-more-comments-container" style="text-align:center; padding: 15px; display:none;">';
		a += '    <button class="load-more-btn" id="load-more-comments-btn">Load More Comments</button>';
		a += '  </div>';
		a += '</div>';
		a += '<div class="comment-form">';
		a += '<textarea class="comment-form-text" placeholder="Comment something..." id="comment-form-text"></textarea>';
		a += '<div class="send-btn" onclick="send_comment()"><i class="fa-solid fa-paper-plane-top"></i></div>';
		a += '</div>';

		_content_right.innerHTML = a;
		_load_comment(data['post_id'], 0);

		// Pagination Button Listener
		$(document).off('click', '#load-more-comments-btn').on('click', '#load-more-comments-btn', function () {
			var pageInput = gebi('page');
			if (pageInput && pageInput.value != -1) {
				var nextPage = Number(pageInput.value) + 1;
				_load_comment(data['post_id'], nextPage);
			}
		});

		if (isMobile()) {
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
		$("textarea").each(function () {
			this.style.height = 0;
			this.style.height = (this.scrollHeight) + "px";
			this.style.overflowY = 'hidden';
		}).on("input", function () {
			this.style.height = 0;
			if (this.scrollHeight < 300) {
				this.style.height = (this.scrollHeight) + "px";
				this.style.overflowY = 'hidden';
			} else {
				this.style.height = "300px";
				this.style.overflowY = 'auto';
			}
		});
		HighLightHLJS();
		changeUrlWork();
	});
}
function _friend_request_toggle(id, accept) {
	ac = '';
	if (accept == 1)
		ac = 'accept';
	else
		ac = 'ignore';
	$.get(backend_url + "friend_request_toggle.php?id=" + id + "&" + ac, function (data) {
		if (data['success'] == 1) {
			t = gebi('toggle-fr-' + data['id']);
			a = '';
			a += '<center>';
			a += 'accepted';
			a += '</center>';
			t.innerHTML = a;
		}
	});
}
function send_comment() {
	text = gebi("comment-form-text").value.trim();
	if (text === "") return;

	f = new FormData();
	f.append('comment', text);
	$.ajax({
		type: "POST",
		url: backend_url + "comment.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			$.get(backend_url + "fetch_profile_info.php", function (data) {
				b = gebi('comment-box');
				list = gebi('comment-list');

				// Clear empty state if exists
				if (list.querySelector('.empty-comments-state')) {
					list.innerHTML = '';
				}

				a = '';
				a += '<div class="comment-item" style="animation: fadeIn 0.4s ease forwards;">';
				a += '<img class="comment-pfp" src="';
				a += (data['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] : getDefaultUserImage(data['user_gender']);
				a += '">';

				a += '<div class="comment-bubble">';
				a += '<div class="comment-header">';
				a += '<a class="comment-user" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
				if (data['verified'] > 0)
					a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" style="margin-left:4px; font-size: 11px;"></i>';
				a += '</a>';
				a += '<span class="comment-time">' + timeSince(Date.now()) + '</span>';
				a += '</div>';
				a += '<div class="comment-content">' + text.replace(/\n/g, '<br>') + '</div>';
				a += '</div>'; // End bubble
				a += '</div>'; // End item

				list.innerHTML += a;
				gebi("comment-form-text").value = '';
				gebi("comment-form-text").style.height = '48px';

				// Scroll to bottom
				b.scrollTop = b.scrollHeight;

				changeUrlWork();
			});
		}
	});
}
function _friend_toggle() {
	special = gebi("special");
	f = new FormData();
	f.append(special.name, '1');
	$.ajax({
		type: "POST",
		url: backend_url + "friend_toggle.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			if (special.name == "request") {
				special.name = "remove";
				special.value = window["lang__005"];
			} else {
				special.name = "request";
				special.value = window["lang__006"];
			}
		}
	});
}
function _follow_toggle() {
	follow = gebi("follow");
	f = new FormData();
	f.append('id', get("id"));
	$.ajax({
		type: "POST",
		url: backend_url + "follow_toggle.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			if (follow.name == "f") {
				follow.name = "u";
				follow.value = window["lang__005"];
			} else {
				follow.name = "f";
				follow.value = window["lang__006"];
			}
		}
	});
}
function showMore(id) {
	cap = gebi('caption_box-' + id);
	cap.style.height = (cap.children[1].clientHeight + 15) + "px";
	gebi('caption_box_shadow-' + id).style.display = "none";
}
function _online() {
	$.ajax({
		url: backend_url + "online.php",
		type: 'GET',
		success: function (res) {
			if (res == 0)
				document.location = "/index.php";
		}
	});
	changeUrlWork();
}
function _fr_count() {
	$.ajax({
		url: backend_url + "friend_request_count.php",
		type: 'GET',
		success: function (res) {
			var el = gebi('friend_req_count');
			if (el) {
				el.innerHTML = res;
				el.style.display = (res > 0) ? 'block' : 'none';
			}
		}
	});
}

function _notification_count() {
	$.get(backend_url + "fetch_notification.php?action=count", function (r) {
		if (r.success === 1) {
			var el = gebi('notification_count');
			if (el) {
				el.innerHTML = r.count;
				el.style.display = (r.count > 0) ? 'block' : 'none';
			}
		}
	});
}

function loadNotifications() {
	var list = gebi('notification-list');
	if (!list) return;

	$.get(backend_url + "fetch_notification.php")
		.done(function (r) {
			if (r.success === 1) {
				var h = '';
				if (!r.notifications || r.notifications.length === 0) {
					h = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);">';
					h += '<i class="fa-regular fa-bell-slash fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i>';
					h += '<p>No notifications yet.</p></div>';
				} else {
					r.notifications.forEach(function (n) {
						var pfp = (n.pfp_media_id > 0) ? pfp_cdn + '&id=' + n.pfp_media_id + "&h=" + n.pfp_media_hash : getDefaultUserImage(n.user_gender);
						var msg = '';
						switch (n.type) {
							case 'like': msg = 'liked your post'; break;
							case 'comment': msg = 'commented on your post'; break;
							case 'share': msg = 'shared your post'; break;
							default: msg = 'interacted with your content';
						}

						h += '<li class="notification-item' + (n.is_read == 0 ? ' unread' : '') + '" onclick="modal_open(\'view_post\',' + n.reference_id + ')">';
						h += '<img src="' + pfp + '" class="notification-pfp">';
						h += '<div class="notification-info">';
						h += '<p class="notification-text"><strong>' + n.user_firstname + ' ' + n.user_lastname + '</strong> ' + msg + '</p>';
						h += '<span class="notification-time">' + timeSince(new Date(n.created_time).getTime()) + '</span>';
						h += '</div>';
						if (n.is_read == 0) h += '<div class="unread-dot"></div>';
						h += '</li>';
					});
				}
				list.innerHTML = h;
				_notification_count(); // Update counter when list is loaded
			} else {
				list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--color-text-dim);"><p>Failed to load notifications</p></div>';
			}
		})
		.fail(function () {
			list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--color-text-dim);"><p>Error connecting to server</p></div>';
		});
}

function markAllRead() {
	$.get(backend_url + "fetch_notification.php?action=read_all", function (r) {
		if (r.success === 1) {
			loadNotifications();
			_notification_count();
			_fr_count();
		}
	});
}

function _load_hljs() {
	$.ajax({
		url: backend_url + "hljs_lang_list.php",
		type: 'GET',
		success: function (res) {
			hljs_lang_list = gebi('hljs_lang_list');
			for (let i = 0; i < res.length; i++) {
				ScriptLink = document.createElement("script");
				ScriptLink.src = "/resources/js/highlight/" + res[i];
				hljs_lang_list.appendChild(ScriptLink);
			}
		}
	});
	changeUrlWork();
}
function _load_settings() {
	tab = get("tab");
	if (tab == undefined)
		tab = 'account';
	current_tab = gebi('tab-' + tab);
	if (current_tab != null)
		current_tab.classList.add("active");
	current_setting_tab = gebi('setting-tab-' + tab);
	if (current_setting_tab != null)
		current_setting_tab.style.display = "block";
	l_user_about = lsg('user_about');
	l_user_hometown = lsg('user_hometown');
	l_usernickname = lsg('user_nickname');
	l_userfirstname = lsg('userfirstname');
	l_userlastname = lsg('userlastname');
	l_user_email = lsg('user_email');
	l_cover_media_id = lsg('cover_media_id');
	l_cover_media_hash = lsg('cover_media_hash');
	l_pfp_media_id = lsg('pfp_media_id');
	l_pfp_media_hash = lsg('pfp_media_hash');
	l_user_gender = lsg('user_gender');
	l_user_birthdate = lsg('user_birthdate');
	l_verified = lsg('verified');
	$.ajax({
		url: backend_url + "fetch_profile_setting_info.php",
		type: 'GET',
		success: function (r) {
			if (l_user_about != r['user_about']) lss('user_about', r['user_about']);
			if (l_user_hometown != r['user_hometown']) lss('user_hometown', r['user_hometown']);
			if (l_usernickname != r['user_nickname']) lss('user_nickname', r['user_nickname']);
			if (l_userfirstname != r['user_firstname']) lss('user_firstname', r['user_firstname']);
			if (l_userlastname != r['user_lastname']) lss('user_lastname', r['user_lastname']);
			if (l_user_email != r['user_email']) lss('user_email', r['user_email']);
			if (l_cover_media_id != r['cover_media_id']) lss('cover_media_id', r['cover_media_id']);
			if (l_cover_media_hash != r['cover_media_hash']) lss('cover_media_hash', r['cover_media_hash']);
			if (l_pfp_media_id != r['pfp_media_id']) lss('pfp_media_id', r['pfp_media_id']);
			if (l_pfp_media_hash != r['pfp_media_hash']) lss('pfp_media_hash', r['pfp_media_hash']);
			if (l_user_gender != r['user_gender']) lss('user_gender', r['user_gender']);
			if (l_user_birthdate != r['user_birthdate']) lss('user_birthdate', r['user_birthdate']);
			if (l_verified != r['verified']) lss('verified', r['verified']);
		}
	});
	usernickname = gebi('usernickname');
	userfirstname = gebi('userfirstname');
	userlastname = gebi('userlastname');
	malegender = gebi('malegender');
	femalegender = gebi('femalegender');
	othergender = gebi('othergender');
	email = gebi('email');
	user_hometown = gebi('userhometown');
	user_about = gebi('userabout');
	verified = gebi('verified');
	verified_text = gebi('verified-text');
	birthday = gebi('birthday');
	profile_picture = gebi('profile_picture');
	setting_profile_cover = gebi('setting_profile_cover');
	psrc = '';
	user_about.value = l_user_about != null ? l_user_about : lsg('user_about');
	user_hometown.value = l_user_hometown != null ? l_user_hometown : lsg('user_hometown');
	usernickname.value = l_usernickname != null ? l_usernickname : lsg('user_nickname');
	userfirstname.value = l_userfirstname != null ? l_userfirstname : lsg('user_firstname');
	userlastname.value = l_userlastname != null ? l_userlastname : lsg('user_lastname');
	email.value = l_user_email != null ? l_user_email : lsg('user_email');
	l_cover_media_id = l_cover_media_id != null ? l_cover_media_id : lsg('cover_media_id');
	l_cover_media_hash = l_cover_media_hash != null ? l_cover_media_hash : lsg('cover_media_hash');
	l_pfp_media_id = l_pfp_media_id != null ? l_pfp_media_id : lsg('pfp_media_id');
	l_pfp_media_hash = l_pfp_media_hash != null ? l_pfp_media_hash : lsg('pfp_media_hash');
	user_gender = l_user_gender != null ? l_user_gender : lsg('user_gender');
	l_verified = l_verified != null ? l_verified : lsg('verified');
	if (l_cover_media_id > 0)
		setting_profile_cover.style.backgroundImage = 'url("' + pfp_cdn + '&id=' + l_cover_media_id + '&h=' + l_cover_media_hash + '")';
	psrc = (l_pfp_media_id > 0) ? pfp_cdn + '&id=' + l_pfp_media_id + "&h=" + l_pfp_media_hash : getDefaultUserImage(l_user_gender != null ? l_user_gender : lsg('user_gender'));
	profile_picture.src = psrc;
	birthday.value = birthdateConverter((l_user_birthdate != null ? l_user_birthdate : lsg('user_birthdate')) * 1000);
	if (user_gender == 'F')
		femalegender.checked = true;
	else if (user_gender == 'M')
		malegender.checked = true;
	else
		othergender.checked = true;
	if (l_verified > 0) {
		switch (Number(l_verified)) {
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
		verified.classList.add('verified_color_' + l_verified);
	} else {
		verified_text.innerText = "Not Verified";
		verified.classList.add("fa-solid");
		verified.classList.add("fa-x");
	}

	// Update display spans for settings page
	if (gebi('display_nickname')) gebi('display_nickname').innerText = usernickname.value;
	if (gebi('display_email')) gebi('display_email').innerText = email.value;

	_load_2fa_status();

	changeUrlWork();
}

function _load_2fa_status() {
	var statusText = gebi('2fa-status-text');
	var btn = gebi('2fa-btn');
	if (!statusText || !btn) return;

	$.get(backend_url + "2fa_status.php", function (r) {
		if (r.success === 1) {
			if (r.enabled) {
				statusText.innerText = "Enabled";
				statusText.style.color = "var(--color-primary)";
				btn.innerText = "Manage";
				btn.classList.add("primary");
				btn.classList.remove("red_alert");
			} else {
				statusText.innerText = "Disabled";
				statusText.style.color = "var(--color-text-dim)";
				btn.innerText = "Enable";
				btn.classList.remove("primary");
				btn.classList.remove("red_alert");
			}
		}
	}).fail(function () {
		statusText.innerText = "Error loading 2FA status";
	});
}

function _manage_2fa() {
	// Show loading
	gebi("modal").style.display = "flex";
	var content = gebi("modal_content");
	content.innerHTML = '<div class="upload-modal-container"><div class="upload-modal-body" style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:15px;">Loading 2FA settings...</p></div></div>';

	$.get(backend_url + '2fa_status.php', function (r) {
		if (r.success === 1) {
			if (!r.enabled) {
				modal_open('2fa_select');
			} else {
				// Show new manage modal
				_show_2fa_manage_modal(r);
			}
		} else {
			alert('Failed to load 2FA status');
			modal_close();
		}
	});
}

function _show_2fa_manage_modal(data) {
	var content = gebi("modal_content");
	var h = '';
	h += '<div class="upload-modal-container" style="max-width:600px;">';
	h += '<div class="upload-modal-header">';
	h += '<h2>Manage Two-Factor Authentication</h2>';
	h += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
	h += '</div>';
	h += '<div class="upload-modal-body" style="padding:20px;">';

	// Authenticator App Section
	h += '<div class="manage-section" style="margin-bottom:30px;">';
	h += '<h3 style="margin-bottom:15px; font-size:1.2em; border-bottom:1px solid var(--color-border); padding-bottom:10px;">Authenticator App</h3>';
	if (data.totp_enabled) {
		h += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px;">';
		h += '<div><span style="color:var(--color-success);"><i class="fa-solid fa-check-circle"></i> Enabled</span><p style="margin:5px 0 0 0; font-size:0.9em; color:var(--color-text-dim);">Using Google Authenticator or similar</p></div>';
		h += '<button class="setting-btn red_alert" onclick="modal_open(\'2fa_disable\')" style="padding:8px 15px;">Disable</button>';
		h += '</div>';
	} else {
		h += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px;">';
		h += '<div><span style="color:var(--color-text-dim);"><i class="fa-solid fa-circle"></i> Not active</span></div>';
		h += '<button class="setting-btn" onclick="modal_open(\'2fa_setup\')" style="padding:8px 15px;">Setup</button>';
		h += '</div>';
	}
	h += '</div>';
	h += '<br>';
	// Security Keys Section
	h += '<div class="manage-section">';
	h += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--color-border); padding-bottom:10px;">';
	h += '<h3 style="margin:0; font-size:1.2em;">Security Keys</h3>';
	h += '<button class="setting-btn" onclick="_setup_security_key()" style="padding:5px 12px; font-size:0.85em;"><i class="fa-solid fa-plus"></i> Add Key</button>';
	h += '</div>';

	if (data.security_keys && data.security_keys.length > 0) {
		h += '<div class="security-keys-list" style="display:flex; flex-direction:column; gap:10px;">';
		data.security_keys.forEach(function (key) {
			h += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:12px 15px; border-radius:12px;">';
			h += '<div><i class="fa-solid fa-key" style="color:var(--color-primary); margin-right:10px;"></i> <strong>' + key.name + '</strong>';
			h += '<p style="margin:5px 0 0 0; font-size:0.8em; color:var(--color-text-dim);">Added: ' + key.created_at + '</p></div>';
			h += '<button class="btn-icon red_alert" onclick="_remove_security_key(' + key.id + ')" title="Remove Key"><i class="fa-solid fa-trash"></i></button>';
			h += '</div>';
		});
		h += '</div>';
	} else {
		h += '<div style="text-align:center; padding:20px; color:var(--color-text-dim); background:rgba(255,255,255,0.02); border-radius:12px;">';
		h += '<p>No security keys registered.</p>';
		h += '</div>';
	}
	h += '</div>';

	h += '</div>'; // Body end
	h += '</div>';
	content.innerHTML = h;
}

function _remove_security_key(id) {
	if (!confirm('Are you sure you want to remove this security key?')) return;

	fetch(backend_url + 'webauthn_remove.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ credential_id: id })
	})
		.then(r => r.json())
		.then(data => {
			if (data.success) {
				_manage_2fa(); // Refresh management modal
				_load_2fa_status(); // Update settings page text
			} else {
				alert('Error: ' + data.error);
			}
		});
}

function _setup_security_key() {
	modal_close();

	// Show loading
	gebi("modal").style.display = "flex";
	var content = gebi("modal_content");
	content.innerHTML = '<div class="upload-modal-container"><div class="upload-modal-body" style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><p style="margin-top:15px;">Preparing Security Key registration...</p></div></div>';

	// Get registration options
	fetch(backend_url + 'webauthn_register.php')
		.then(r => r.json())
		.then(data => {
			if (!data.success) {
				alert('Failed to initialize registration');
				modal_close();
				return;
			}

			var options = data.options;

			// Convert base64url to ArrayBuffer
			options.challenge = _base64UrlToBuffer(options.challenge);
			options.user.id = _base64UrlToBuffer(options.user.id);
			if (options.excludeCredentials) {
				options.excludeCredentials = options.excludeCredentials.map(function (cred) {
					return { type: cred.type, id: _base64UrlToBuffer(cred.id) };
				});
			}

			content.innerHTML = '<div class="upload-modal-container"><div class="upload-modal-body" style="padding:40px; text-align:center;"><i class="fa-solid fa-key fa-3x" style="color:var(--color-primary);"></i><p style="margin-top:15px;font-size:1.2em;">Insert and touch your Security Key</p><p style="color:var(--color-text-dim);margin-top:10px;">Follow your browser prompts to register the key.</p></div></div>';

			// Call WebAuthn API
			navigator.credentials.create({ publicKey: options })
				.then(function (credential) {
					var response = {
						clientDataJSON: _bufferToBase64Url(credential.response.clientDataJSON),
						attestationObject: _bufferToBase64Url(credential.response.attestationObject)
					};

					return fetch(backend_url + 'webauthn_register.php', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ response: response })
					});
				})
				.then(function (r) { return r.json(); })
				.then(function (result) {
					if (result.success) {
						modal_close();
						_success_modal('Security Key Registered!');
						_load_2fa_status();
					} else {
						alert('Registration failed: ' + result.error);
						modal_close();
					}
				})
				.catch(function (err) {
					console.error('WebAuthn error:', err);
					alert('Security key registration failed or was cancelled.');
					modal_close();
				});
		})
		.catch(function (err) {
			console.error('Fetch error:', err);
			alert('Failed to connect to server');
			modal_close();
		});
}

function _base64UrlToBuffer(base64url) {
	var base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	var padLen = (4 - base64.length % 4) % 4;
	var padded = base64 + '='.repeat(padLen);
	var binary = atob(padded);
	var buffer = new Uint8Array(binary.length);
	for (var i = 0; i < binary.length; i++) {
		buffer[i] = binary.charCodeAt(i);
	}
	return buffer.buffer;
}

function _bufferToBase64Url(buffer) {
	var bytes = new Uint8Array(buffer);
	var binary = '';
	for (var i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	var base64 = btoa(binary);
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function changeTab(t) {
	var tabs = ['account', 'profile', 'about'];
	for (var i = 0; i < tabs.length; i++) {
		var x = tabs[i];
		if (gebi('setting-tab-' + x)) gebi('setting-tab-' + x).style.display = 'none';
		if (gebi('tab-' + x)) gebi('tab-' + x).classList.remove('active');
	}
	if (gebi('setting-tab-' + t)) gebi('setting-tab-' + t).style.display = 'block';
	if (gebi('tab-' + t)) gebi('tab-' + t).classList.add('active');

	var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?tab=' + t;
	window.history.pushState({ path: newUrl }, '', newUrl);
}
function _success_modal(t = "success") {
	gebi("modal").style.display = "flex";
	var a = '';
	a += '<div class="upload-modal-container">';
	a += '<div class="upload-modal-body" style="padding:40px; text-align:center; flex-direction:column;">';

	a += '<div class="success-checkmark">';
	a += '<div class="check-icon">';
	a += '<span class="icon-line line-tip"></span>';
	a += '<span class="icon-line line-long"></span>';
	a += '<div class="icon-circle"></div>';
	a += '<div class="icon-fix"></div>';
	a += '</div>';
	a += '</div>';

	a += '<h2 style="margin-top:20px;">' + t + '</h2>';
	a += '<br>';
	a += '<button class="btn-primary" onclick="modal_close()">OK</button>';

	a += '</div>';
	a += '</div>';
	gebi("modal_content").innerHTML = a;

	// Reset Styles just in case
	var content = gebi("modal_content");
	content.style.padding = "0";
	content.style.background = "transparent";
	content.style.boxShadow = "none";
}
function _change_profile_infomation() {
	var userfirstname = gebi("userfirstname").value;
	var userlastname = gebi("userlastname").value;
	var birthday = gebi("birthday").value;
	var userhometown = gebi("userhometown").value;
	var userabout = gebi("userabout").value;
	var usergender = gebcn("usergender");
	usergender = (usergender[0].checked ? "M" : (usergender[1].checked ? "F" : (usergender[2].checked ? "U" : "U")));
	d = new FormData();
	d.append('type', 'ChangePofileInfomation');
	d.append('userfirstname', userfirstname);
	d.append('userlastname', userlastname);
	d.append('birthday', birthday);
	d.append('userhometown', userhometown);
	d.append('userabout', userabout);
	d.append('usergender', usergender);
	$.ajax(backend_url + 'change_account_infomation.php', {
		method: "POST",
		data: d,
		processData: false,
		contentType: false,
		success: function (q) {
			if (q['success'] != 1) {
				a = '';
				switch (q['code']) {
					case 0:
						a = window['lang__046'];
						break;
					case 1:
						a = window['lang__78'];
						break;
					case 2:
						a = window['lang__053'];
						break;
				}
				alert(a);
			} else {
				_success_modal(window['lang__079']);
			}
		}
	});
}
function _change_infomation(c = null) {
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "flex";
	var m = '';
	var t = '';

	switch (c) {
		case 0:
			t = window['lang__056']; // Change Password
			m += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="currentpassword">' + window['lang__059'] + '</label>';
			m += '<input type="password" name="password" id="currentpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="newpassword">' + window['lang__060'] + '</label>';
			m += '<input type="password" name="newpassword" id="newpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="vnewpassword">' + window['lang__061'] + '</label>';
			m += '<input type="password" name="vnewpassword" id="vnewpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label style="display:flex; align-items:center; gap:10px; cursor:pointer;">';
			m += '<input type="checkbox" name="log_all_device" id="log_all_device"> ' + window['lang__064'];
			m += '</label>';
			m += '</div>';

			m += '</div>';
			break;
		case 1:
			t = window['lang__057']; // Change Username
			m += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="currentpassword">' + window['lang__059'] + '</label>';
			m += '<input type="password" name="password" id="currentpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="newusername">' + window['lang__062'] + '</label>';
			m += '<input type="text" name="newusername" id="newusername" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '</div>';
			break;
		case 2:
			t = window['lang__058']; // Change Email
			m += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="currentpassword">' + window['lang__059'] + '</label>';
			m += '<input type="password" name="password" id="currentpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="newemail">' + window['lang__063'] + '</label>';
			m += '<div style="display:flex; gap:10px;">';
			m += '<input type="email" name="newemail" id="newemail" class="index_input_box" style="flex:1;" required>';
			m += '<button class="btn-primary" id="getCode" style="white-space:nowrap;"><div class="background" id="gcb"></div>' + window['lang__067'] + ' <i class="fa-light fa-envelope"></i></button>';
			m += '</div>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="verifyCode">' + window['lang__069'] + '</label>';
			m += '<input type="text" name="verifyCode" id="verifyCode" class="index_input_box" maxlength="8" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '</div>';
			break;
		default:
			modal_close();
			return;
	}

	var a = '';
	a += '<div class="upload-modal-container">';

	// Header
	a += '<div class="upload-modal-header">';
	a += '<h2>' + t + '</h2>';
	a += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
	a += '</div>';

	// Content (m is already wrapped in body or parts of it)
	a += m;

	// Footer
	a += '<div class="upload-modal-footer">';
	a += '<button id="btnChangeInfo" class="btn-primary">' + t + '</button>';
	a += '</div>';

	a += '</div>'; // End container

	gebi("modal_content").innerHTML = a;

	// Reset Styles
	var content = gebi("modal_content");
	content.style.padding = "0";
	content.style.background = "transparent";
	content.style.boxShadow = "none";
	load_lang();
	r = gebcn('required');
	if (c == 2) {
		$('#getCode').click(function () {
			p = $(this);
			v = gebi('newemail');
			if (v.value == '')
				r[0].innerHTML = window['lang__046'];
			if (!p.hasClass('disabled')) {
				d = new FormData();
				d.append('type', 'RequestEmailCode');
				d.append('CurrentPassword', btoa(gebi('currentpassword').value));
				d.append('NewEmail', v.value);
				$.ajax(backend_url + 'change_account_infomation.php', {
					method: "POST",
					data: d,
					processData: false,
					contentType: false,
					success: function (q) {
						if (q['success'] != 1) {
							switch (q['code']) {
								case 0:
									m = window['lang__054'];
									i = 1;
									break;
								case 1:
									m = window['lang__055'];
									i = 0;
									break;
								case 2:
									m = window['lang__050'];
									i = 1;
									break;
							}
							r[i].innerHTML = m;
							r[i].style.color = 'red';
						}
					}
				});
				b = gebi('gcb');
				b.classList.add('disabled');
				p.prop('disabled', true);
				setTimeout(function () {
					b.classList.remove('disabled');
					p.prop('disabled', false);
				}, 60000);
				r[0].innerHTML = '';
			}
		});
	}
	if (c == 1 || c == 2) {
		t = (c == 2) ? 'email' : 'username';
		v = gebi('new' + t);
		v.addEventListener('keyup', e => {
			clearTimeout(l);
			l = setTimeout(() => {
				d = new FormData();
				d.append(t, e.target.value);
				$.ajax(backend_url + t + '_check.php', {
					method: "POST",
					data: d,
					processData: false,
					contentType: false,
					async: false,
					success: function (q) {
						a = false;
						if (q['code'] == 1) {
							m = (c == 1) ? window['lang__051'] : window['lang__050'];
						} else if (q['code'] == 2) {
							m = (c == 1) ? window['lang__052'] : window['lang__054'];
						} else {
							m = (c == 1) ? window['lang__065'] : window['lang__066'];
							a = true;
						}
						r[1].innerHTML = m;
						r[1].style.color = a ? 'green' : 'red';
					}
				});
			}, 500);
		});
	}
	$('#btnChangeInfo').click(function () {
		f = new FormData();
		s = gebi('currentpassword').value;
		if (s == '' || s == undefined) {
			alert("Where password?");
			return;
		}
		switch (c) {
			case 0:
				p = gebi('newpassword').value;
				v = gebi('vnewpassword').value;
				l = gebi('log_all_device').checked ? 1 : 0;
				if (p != v) {
					r[1].innerHTML = window['lang__047'];
					r[2].innerHTML = window['lang__047'];
					return;
				}
				f.append('type', 'ChangePassword');
				f.append('CurrentPassword', btoa(s));
				f.append('NewPassword', btoa(p));
				f.append('VerifyPassword', btoa(v));
				f.append('LogAllsDevice', l);
				break;
			case 1:
				f.append('type', 'ChangeUsername');
				f.append('CurrentPassword', s);
				f.append('NewUsername', v.value);
				break;
			case 2:
				v = gebi('newemail').value;
				p = gebi('verifyCode').value;
				f.append('type', 'ChangeEmail');
				f.append('CurrentPassword', btoa(s));
				f.append('NewEmail', v);
				f.append('VerifyCode', p);
				break;
			default:
				modal_close();
				return 0;
		}

		$.ajax(backend_url + 'change_account_infomation.php', {
			method: "POST",
			data: f,
			processData: false,
			contentType: false,
			success: function (q) {
				if (q['success'] == 0) {
					switch (c) {
						case 0:
							switch (q['code']) {
								case 0:
									r[1].innerHTML = window['lang__047'];
									r[2].innerHTML = window['lang__047'];
									break;
								case 1:
									r[0].innerHTML = window['lang__055'];
									break;
							}
							break;
						case 1:
							switch (q['code']) {
								case 0:
									r[1].innerHTML = window['lang__052'];
									break;
								case 1:
									r[0].innerHTML = window['lang__055'];
									break;
								case 2:
									r[0].innerHTML = window['lang__051'];
									break;
							}
							break;
						case 2:
							switch (q['code']) {
								case 0:
									r[1].innerHTML = window['lang__054'];
									break;
								case 1:
									r[0].innerHTML = window['lang__055'];
									break;
								case 2:
									r[0].innerHTML = window['lang__050'];
									break;
								case 3:
									r[2].innerHTML = window['lang__081'];
									break;
							}
							break;
						default:
							modal_close();
							return 0;
					}
				} else {
					_success_modal();
					setTimeout(function () {
						location.reload();
					}, 3000);
				}
			}
		});
	});
}
function _change_picture(isCover = 0) {
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "flex"; // Using flex for centering if modal css supports it, otherwise block

	// Create Clean Modal Content
	var a = '';
	a += '<div class="upload-modal-container">';

	// Header
	a += '<div class="upload-modal-header">';
	a += '<h2>' + ((isCover == 1) ? window['lang__041'] : window['lang__042']) + '</h2>';
	a += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
	a += '</div>';

	// Body
	a += '<div class="upload-modal-body">';

	// Upload Area
	a += '<label class="file-upload-label" for="fileInput">';
	a += '<div class="upload-placeholder" id="uploadPlaceholder">';
	a += '<i class="fa-solid fa-cloud-arrow-up"></i>';
	a += '<span>Click to Upload Image</span>';
	a += '</div>';
	a += '<input type="file" id="fileInput" accept="image/*" class="file-input-hidden" />';
	a += '</label>';

	// Cropper Area
	a += '<div id="cropper_box" style="display:none;">';
	a += '<div class="cropper-wrapper">';
	a += '<canvas id="canvas"></canvas>';
	a += '</div>';
	a += '</div>';

	// Result Preview (Hidden usually until saved?)
	a += '<div id="imgresult"></div>';

	a += '</div>'; // End body

	// Footer
	a += '<div class="upload-modal-footer">';
	a += '<button id="btnCrop" class="btn-primary" style="display:none;">' + window['lang__043'] + '</button>';
	a += '<button id="btnSavePicture" class="btn-success" style="display:none;">' + window['lang__044'] + '</button>';
	a += '</div>';

	a += '</div>'; // End container

	gebi("modal_content").innerHTML = a;

	// Reset modal styling that might have been set by other functions
	// We rely on CSS classes now, but specific override might be needed if modal_content has residual styles
	gebi("modal_content").style.padding = "0";
	gebi("modal_content").style.background = "transparent";
	gebi("modal_content").style.boxShadow = "none";


	canvas = $("#canvas");
	context = canvas.get(0).getContext("2d");
	$result = $('#imgresult');

	$('#fileInput').on('change', function () {
		if (this.files && this.files[0]) {
			if (this.files[0].type.match(/^image\//)) {
				var reader = new FileReader();
				reader.onload = function (evt) {
					// Hide placeholder, show cropper
					$('#uploadPlaceholder').css('display', 'none');
					$('#cropper_box').css('display', 'block');
					$('#btnCrop').css('display', 'inline-block');

					var img = new Image();
					img.onload = function () {
						context.canvas.height = img.height;
						context.canvas.width = img.width;
						context.drawImage(img, 0, 0);
						cropper = canvas.cropper({
							aspectRatio: (isCover == 1) ? (16 / 9) : (1 / 1),
							viewMode: 2,
							dragMode: 'move',
							background: false,
							autoCropArea: 1,
							modal: false
						});

						$('#btnCrop').click(function () {
							croppedImageDataURL = canvas.cropper('getCroppedCanvas').toDataURL("image/png");

							// Visual Feedback only if needed, currently just hides canvas and shows save
							canvas.css('display', 'none');
							$('#btnCrop').css('display', 'none');
							$('#btnSavePicture').css('display', 'inline-block');
							$('#cropper_box').css('display', 'none');

							// Optional: Show preview in results
							// $result.html('<img src="'+croppedImageDataURL+'" style="max-width:100%; border-radius:8px;">');

							canvas.cropper('getCroppedCanvas').toBlob(function (blob) {
								$('#btnSavePicture').click(function () {
									var formData = new FormData();
									formData.append('fileUpload', blob, 'media_cropped.jpg');
									formData.append('type', (isCover == 1) ? 'cover' : 'profile'); // Fixed type

									// Show loading state?
									$(this).text('Saving...').prop('disabled', true);

									$.ajax(backend_url + 'change_picture.php', {
										method: "POST",
										data: formData,
										processData: false,
										contentType: false,
										success: function () {
											modal_close();
											// Reload specific image
											if (isCover == 1) {
												$("#profile_cover").css('background-image', "url('" + croppedImageDataURL + "')");
												$("#setting_profile_cover").css('background-image', "url('" + croppedImageDataURL + "')");
											} else {
												$("#profile_image").attr('src', croppedImageDataURL);
												$("#profile_picture").attr('src', croppedImageDataURL);
											}
										}
									});
								});
							}, 'image/jpeg', 0.9);
						});
					};
					img.src = evt.target.result;
				};
				reader.readAsDataURL(this.files[0]);
			} else {
				alert("Invalid image type!");
			}
		}
	});
}
/* --- Carousel Logic --- */
function renderMedia(mediaListStr) {
	if (!mediaListStr) return '';
	var items = [];
	var parts = mediaListStr.split(',');
	parts.forEach(function (p) {
		var d = p.split(':');
		if (d.length >= 3) {
			items.push({ id: d[0], hash: d[1], format: d[2] });
		}
	});

	if (items.length === 0) return '';

	if (items.length === 1) {
		// Single Item
		var s = items[0];
		if (s.format.startsWith('video'))
			return '<center><video style="max-height:500px; max-width: 100%" src="' + media_cdn + '&id=' + s.id + '&h=' + s.hash + '" controls></video></center>';
		else
			return '<center><img src="' + media_cdn + '&id=' + s.id + '&h=' + s.hash + '" style="max-width:100%;"></center>';
	} else {
		// Carousel
		var uid = Math.floor(Math.random() * 1000000);
		var h = '<div class="carousel-container" id="carousel-' + uid + '">';

		// Slides
		items.forEach(function (s, idx) {
			var active = (idx === 0) ? 'active' : '';
			var content = '';
			let mediaUrl = media_cdn + '&id=' + s.id + '&h=' + s.hash;
			if (s.format.startsWith('video')) {
				content = '<video style="max-height:500px; max-width: 100%" src="' + mediaUrl + '" controls></video>';
			} else {
				content = '<img src="' + mediaUrl + '" style="max-width:100%;">';
			}
			h += '<div class="carousel-slide ' + active + '" data-index="' + idx + '">' + content + '</div>';
		});

		// Nav
		h += '<button class="carousel-prev" onclick="moveSlide(\'' + uid + '\', -1)">&#10094;</button>';
		h += '<button class="carousel-next" onclick="moveSlide(\'' + uid + '\', 1)">&#10095;</button>';

		// Dots
		h += '<div class="dots-container">';
		items.forEach(function (s, idx) {
			var active = (idx === 0) ? 'active' : '';
			h += '<span class="dot ' + active + '" onclick="currentSlide(\'' + uid + '\', ' + idx + ')"></span>';
		});
		h += '</div>';

		h += '</div>';
		return h;
	}
}

function moveSlide(uid, n) {
	var container = gebi('carousel-' + uid);
	var slides = container.getElementsByClassName("carousel-slide");
	var dots = container.getElementsByClassName("dot");
	var current = 0;

	for (var i = 0; i < slides.length; i++) {
		if (slides[i].classList.contains('active')) {
			current = i;
			break;
		}
	}

	showSlide(uid, current + n);
}

function currentSlide(uid, n) {
	showSlide(uid, n);
}

function showSlide(uid, n) {
	var container = gebi('carousel-' + uid);
	var slides = container.getElementsByClassName("carousel-slide");
	var dots = container.getElementsByClassName("dot");

	if (n >= slides.length) { n = 0 }
	if (n < 0) { n = slides.length - 1 }

	for (var i = 0; i < slides.length; i++) {
		slides[i].className = slides[i].className.replace(" active", "");
		if (dots.length > 0) dots[i].className = dots[i].className.replace(" active", "");
	}

	slides[n].className += " active";
	if (dots.length > 0) dots[n].className += " active";
}

/* --- Multi-Upload Preview Logic --- */
var dt = new DataTransfer(); // Holds selected files

function handleFiles(files) {
	// Merge new files into DataTransfer
	for (let i = 0; i < files.length; i++) {
		dt.items.add(files[i]);
	}
	updatePreview();
}

function updatePreview() {
	var container = gebi('media-preview-container');
	container.innerHTML = '';

	for (let i = 0; i < dt.files.length; i++) {
		let file = dt.files[i];
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = function () {
			let div = document.createElement('div');
			div.className = 'media-preview-item';

			let content = '';
			if (file.type.startsWith('image/')) {
				content = '<img src="' + reader.result + '">';
			} else if (file.type.startsWith('video/')) {
				content = '<video src="' + reader.result + '"></video>';
			}

			div.innerHTML = content + '<button class="preview-remove-btn" onclick="removeFile(' + i + ')">x</button>';
			container.appendChild(div);
		}
	}
	// Update input files
	gebi('imagefile').files = dt.files;
}

function removeFile(index) {
	dt.items.remove(index);
	updatePreview();
}


function make_post() {
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "block";

	// Clear DataTransfer on new post
	dt = new DataTransfer();

	a = "";
	a += '<div class="modal-box-container" style="max-width: 550px; margin: 0 auto; padding: 25px;">';
	a += '<div class="share-modal-title">Create New Post</div>';

	a += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">';
	a += '<div class="modal-header-user">';
	a += '<img class="modal-user-pfp" src="' + gebi('pfp_box').src + '">';
	a += '<div style="display:flex; flex-direction:column;">';
	a += '<span class="modal-user-name">' + gebi('fullname').value + '</span>';
	a += '<select name="private" id="private" class="modal-privacy-select">';
	a += '<option value="2">' + window["lang__002"] + '</option>';
	a += '<option value="1">' + window["lang__004"] + '</option>';
	a += '<option value="0">' + window["lang__003"] + '</option>';
	a += '</select>';
	a += '</div>';
	a += '</div>';
	a += '</div>';

	a += '<textarea rows="4" name="caption" class="caption" placeholder="' + window["lang__015"] + '" style="width:100%; border:none; background:transparent; font-size:1.2rem; resize:none; outline:none; margin-bottom:15px;"></textarea>';

	// Multi-upload preview
	a += '<div id="media-preview-container" class="media-preview-grid" style="margin-bottom:15px;"></div>';

	a += '<div class="createpostbuttons" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:20px;">';
	a += '<div style="display:flex; gap:15px; align-items:center;">';
	a += '<label style="cursor:pointer; transition: transform 0.2s;" onmouseover="this.style.transform=\'scale(1.1)\'" onmouseout="this.style.transform=\'scale(1)\'">';
	a += '<i class="fa-regular fa-image" style="font-size:1.6rem; color:var(--color-primary);"></i>';
	a += '<input type="file" accept="image/*,video/*" name="fileUpload[]" id="imagefile" multiple style="display:none;">';
	a += '</label>';
	a += '</div>';
	a += '<input type="button" class="btn-primary" value="' + window["lang__001"] + '" onclick="return validatePost(0)" style="padding: 10px 30px; font-size:1rem; border-radius:10px;">';
	a += '</div>';

	a += '</div>';
	gebi("modal_content").innerHTML = a;

	$(document).ready(function () {
		$('#imagefile').change(function () {
			handleFiles(this.files);
		});
	});
	textarea = gebtn("textarea")[0];
	textarea.focus();
	textarea.oninput = function () {
		textarea.style.height = "";
		textarea.style.height = Math.min(textarea.scrollHeight, 600) + "px";
	};
}

function _f() {
	is_private = gebi('private').value;
	f = new FormData();
	f.append("post", 'post');
	f.append("private", is_private);
	f.append("caption", gebtn("textarea")[0].value);

	// Append all files from DataTransfer
	for (let i = 0; i < dt.files.length; i++) {
		f.append("fileUpload[]", dt.files[i]);
	}

	$.ajax({
		type: "POST",
		url: backend_url + "post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			if (r["success"] == 1)
				fetch_post("fetch_post.php");
		}
	});
}

function _search(page = 0) {
	type = gebi('searchtype').value;
	query = gebi('query').value;
	search = gebi('search');
	f = new FormData();
	f.append("type", type);
	f.append("query", query);
	f.append("page", page);
	$.ajax({
		type: "POST",
		url: backend_url + "search.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			b = make_blob_url(r, 'application/json');
			r = JSON.parse(r);
			a = '';
			if (r['success'] == 2) {
				search.innerHTML = '<div class="post"><div style="text-align:center; padding: 20px;">' + window["lang__084"] + '</div></div>';
			} else if (r['success'] == 1) {
				if (in_array([0, 2, 3], Number(type))) {
					friend_list = gebi("friend_list");
					// Use specific class for grid layout
					search.className = 'search-results-grid';
					for (let i = 0; i < (Object.keys(r).length - 1); i++) {
						a += '<div class="user-card-wrapper">';
						// Cover
						var coverStyle = (r[i]['cover_media_id'] > 0) ? ' style="background-image: url(\'' + pfp_cdn + '&id=' + r[i]['cover_media_id'] + '&h=' + r[i]['cover_media_hash'] + '\')"' : '';
						a += '<div class="user-card-cover"' + coverStyle + '></div>';
						// Content
						a += '<div class="user-card-content">';
						// PFP
						var pfpSrc = (r[i]['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + r[i]['pfp_media_id'] + "&h=" + r[i]['pfp_media_hash'] : getDefaultUserImage(r[i]['user_gender']);
						a += '<img class="user-card-pfp" src="' + pfpSrc + '">';
						// Info
						a += '<div class="user-card-info">';
						a += '<a class="user-card-name" href="profile.php?id=' + r[i]['user_id'] + '">';
						a += r[i]['user_firstname'] + ' ' + r[i]['user_lastname'];
						if (r[i]['verified'] > 0)
							a += ' <i class="fa-solid fa-badge-check verified_color_' + r[i]['verified'] + '" title="' + window["lang__016"] + '"></i>';
						a += '</a>';
						a += '<span class="user-card-username">@' + r[i]['user_nickname'] + '</span>';
						a += '</div>';
						// About
						if (r[i]['user_about'] != '') {
							a += '<div class="search_info_about">' + r[i]['user_about'] + '</div>';
						}
						// Stats
						a += '<div class="user-card-stats">';
						a += 'Following: ' + round_number(r[i]['total_following']) + ' | Followers: ' + round_number(r[i]['total_follower']);
						a += '</div>';
						a += '</div>'; // End content
						a += '</div>'; // End wrapper
					}
					search.innerHTML = a;
				}
				else if (type == 1) {
					search.className = 'search-results-list'; // List layout for posts
					search.innerHTML = '<div id="feed"></div>';
					fetch_post(b, true);
				}
			}
		}
	});
}
function _share_feed() {
	// Share feed also needs update if we allow adding images to shares? 
	// Usually share just adds caption. If user adds image it becomes a new post but referencing old?
	// Current logic: just caption. But let's check input.
	// If share allows upload, we update it too. But share usually doesn't upload new files in this app logic (from previous reading).
	// Let's stick to simple caption for share for now.

	// Wait, original _share_feed grabbed imagefile. If user uploads on share it might be creating a new post with reference?
	// worker/share.php handles fileUpload. So yes, allow upload.
	// But modal is different? ValidatePost(1) calls _share_feed.
	// Where is the share modal? It's likely using same modal but different content?
	// No, usually share button triggers a specific share modal logic.
	// I will leave _share_feed as single file for now or update if I see the share modal generator.

	is_private = gebi('private').value;
	post_id = gebi('post_id').value;
	// ... Keeping share simple for now to avoid complexity explosion, focus on Create Post.

	f = new FormData();
	f.append("post", 'post');
	f.append("private", is_private);
	f.append("post_id", post_id);
	f.append("caption", gebtn("textarea")[0].value);

	// Append all files from DataTransfer (multi-upload support)
	if (typeof dt !== 'undefined' && dt.files.length > 0) {
		for (let i = 0; i < dt.files.length; i++) {
			f.append("fileUpload[]", dt.files[i]);
		}
	}

	$.ajax({
		type: "POST",
		url: backend_url + "share.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			id = gebi('post_id').value;
			splt = r.split(";"); // fixed data -> r
			zTemplate(gebi("post-share-count-" + id), {
				"counter": parseInt(splt[1])
			});
			setTimeout(null, 100);
			fetch_post("fetch_post.php");
		}
	});
}

function validatePost(type) {
	var required = gebcn("required");
	if (required && required.length > 0)
		required[0].style.display = "none";

	if (type == 0)
		_f();
	else
		_share_feed();

	// Clear logic
	dt = new DataTransfer(); // Clear global file holder
	if (gebi("imagefile")) gebi("imagefile").value = null;
	var textarea = gebtn("textarea")[0];
	if (textarea) textarea.value = '';

	modal_close();
	return false;
}

function _setup_2fa() {
	var code = gebi('2fa_setup_code').value;
	if (code.length < 6) {
		alert("Please enter a 6-digit code.");
		return;
	}
	$.post(backend_url + "2fa_setup.php", { code: code }, function (r) {
		if (r.success === 1) {
			modal_close();
			_success_modal("2FA Enabled Successfully!");
			_load_2fa_status();
		} else {
			alert("Invalid code. Please try again.");
		}
	});
}

function _disable_2fa() {
	var pass = gebi('2fa_disable_pass').value;
	var code = gebi('2fa_disable_code').value;
	if (!pass || code.length < 6) {
		alert("Please fill in all fields.");
		return;
	}
	$.post(backend_url + "2fa_disable.php", { password: pass, code: code }, function (r) {
		if (r.success === 1) {
			modal_close();
			_success_modal("2FA Disabled Successfully.");
			_load_2fa_status();
		} else {
			alert("Invalid password or 2FA code.");
		}
	});
}
function HighLightHLJS() {
	if (lsg("load_hightlightjs") == "no")
		return;
	_load_hljs();
	hljs.highlightAll();
}
document.addEventListener('readystatechange', function (e) {
	if (document.readyState == "complete") {
		_load_info();
		load_lang();
		_online();
		_fr_count();
		_notification_count();
		if (gebi("online_status").value == 1)
			setInterval(_online, 300000);
		setInterval(_fr_count, 300000);
		setInterval(_notification_count, 300000);
		onResizeEvent();
		changeUrlWork();
		textAreaRework();
	}
});
function isMobile() {
	let check = false;
	(function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);

	return check;
};
function changeUrlWork() {
	if (isMobile()) {
		cpost_box = gebcn('createpost_box');
		if (cpost_box != null) {
			if (cpost_box.length > 0) {
				cpost_box[0].style.width = "90%";
				ipb = gebcn('input_box');
				ipb[0].style.height = "80px";
				ipb[0].style.marginLeft = "88px";
				ipb[0].style.marginTop = "-90px";
				ipb[0].style.width = "88%";
				pfp_box = gebi('pfp_box');
				pfp_box.style.height = "80px";
				pfp_box.style.width = "80px";
			}
		}
		gebcn('usernav')[0].style.fontSize = "150%";
		container = gebcn('container');
		if (container != null) {
			container[0].style.width = "100%";
		}
		gebtn('body')[0].style.zoom = "0.5";;
		gebtn('body')[0].style.fontSize = "200%";
	}
	$("a").each(function () {
		if (this.href != '' && this.className != "post-link") {
			if (!this.hasAttribute("linked")) {
				this.setAttribute("linked", "true");
				this.addEventListener("click", function (e) {
					e.preventDefault();
					changeUrl(this.pathname + this.search);
				});
			}
		}
	});
}
window.addEventListener("resize", onResizeEvent, true);
function onResizeEvent() {
	if (!isMobile()) {
		bodyElement = gebtn("BODY")[0];
		newWidth = bodyElement.offsetWidth;
		feed = gebi('feed');
		custom_style = gebi('custom_style');
		if (feed != null && custom_style != null) feed.style.marginTop = "-230px";
		if (custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:20% !important;}</style>";
		if (newWidth < 1708 && newWidth < 1350 && newWidth < 1670) {
			if (feed != null) feed.style.marginTop = "0px";
		} else if (newWidth >= 1350 && newWidth < 1708 && newWidth < 1670) {
			if (custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:5% !important;}</style>";
		} else if (newWidth >= 1350 && newWidth < 1708 && newWidth >= 1670) {
			if (custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:15% !important;}</style>";
		}
	}
}

function validateField() {
	query = document.getElementById("query");
	button = document.getElementById("querybutton");
	if (query.value == "") {
		query.placeholder = 'Type something!';
		return false;
	}
	return true;
}
function isBottom() {
	calc = $(window).scrollTop() * 2.15 + $(window).height() > $(document).height() - 200;
	return calc;
}
$(window).scroll(function () {
	u = window.location.pathname;
	if ($(window).height() != $(document).height()) {
		if ((($(window).scrollTop() + $(window).height() > $(document).height() - 100) && !isMobile()) || (isBottom() && isMobile())) {
			if ((u === "/home.php" || u === "home.php") || (u.substring(0, 12) === "/profile.php" || u.substring(0, 11) === "profile.php")) {
				page = gebi('page');
				if (page.value != -1) {
					nextPage = Number(page.value) + 1;
					if (u.substring(0, 12) === "/profile.php" || u.substring(0, 11) === "profile.php") {
						add_header = "";
						if (u.substring(0, 16) === "/profile.php?id=" || u.substring(0, 15) === "profile.php?id=")
							add_header = "&id=" + get("id");
						fetch_post("fetch_profile_post.php?page=" + nextPage + add_header);
					} else {
						fetch_post("fetch_post.php?page=" + nextPage);
					}
					page.value = nextPage;
				}
			} else if (u === "/friends.php" || u === "friends.php") {
				page = gebi('page');
				if (page.value != -1) {
					nextPage = Number(page.value) + 1;
					fetch_friend_list('fetch_friend_list.php?page=' + nextPage);
					page.value = nextPage;
				}
			} else if (u === "/requests.php" || u === "requests.php") {
				page = gebi('page');
				if (page.value != -1) {
					nextPage = Number(page.value) + 1;
					fetch_friend_request('fetch_friend_request.php?page=' + nextPage);
					page.value = nextPage;
				}
			}
		}
	}
});