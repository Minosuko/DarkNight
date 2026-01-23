default_male_pfp = 'data/images.php?t=default_M';
default_female_pfp = 'data/images.php?t=default_F';
default_user_pfp = 'data/images.php?t=default_U';
pfp_cdn = 'data/images.php?t=profile';
media_cdn = 'data/images.php?t=media';
video_cdn = 'data/videos.php?t=media';
backend_url = "/worker/";
_activeProfileTab = 'timeline'; // Track which profile tab is active
supported_language = [
	['en-us', 'English'],
	['ko-kr', '한국어'],
	['ja-jp', '日本語'],
	['zh-cn', '简体中文'],
	['vi-vn', 'Tiếng Việt'],
	['fil-ph', 'Filipino'],
	['id-id', 'Bahasa Indonesia'],
	['th-th', 'ไทย'],
	['fr-fr', 'Français']
];

// Theme initialization
var savedTheme = lsg("theme");
if (savedTheme) {
	document.documentElement.setAttribute('data-theme', savedTheme);
}

// Primary Hue initialization
var savedHue = lsg("primaryHue");
if (savedHue) {
	document.documentElement.style.setProperty('--primary-hue', savedHue);
}


// Language functions are now handled by i18n.js


// Appearance logic
function setPrimaryHue(hue) {
	document.documentElement.style.setProperty('--primary-hue', hue);
	lss('primaryHue', hue);
	updateColorPresetsUI();
}

function updateColorPresetsUI() {
	var currentHue = lsg("primaryHue") || 210;
	document.querySelectorAll('.color-preset').forEach(function (el) {
		if (el.dataset.hue == currentHue) el.classList.add('active');
		else el.classList.remove('active');
	});
}

// Theme toggle function
function toggleTheme() {
	var currentTheme = document.documentElement.getAttribute('data-theme');
	var newTheme = currentTheme === 'light' ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', newTheme);
	lss('theme', newTheme);
	updateThemeIcon();
}

function updateThemeIcon() {
	var themeBtn = gebi('theme-toggle-btn');
	var settingToggle = gebi('setting-theme-toggle');
	var currentTheme = document.documentElement.getAttribute('data-theme');

	if (themeBtn) {
		themeBtn.innerHTML = currentTheme === 'light'
			? '<i class="fa-solid fa-moon"></i>'
			: '<i class="fa-solid fa-sun"></i>';
	}

	if (settingToggle) {
		var slider = settingToggle.querySelector('.theme-switch-slider');
		if (slider) {
			slider.style.left = currentTheme === 'light' ? '2px' : '26px';
			slider.innerHTML = currentTheme === 'light'
				? '<i class="fa-solid fa-sun"></i>'
				: '<i class="fa-solid fa-moon"></i>';
		}
	}
}


// Utility for Copy to Clipboard
function copyToClipboard(text, btnId) {
	if (!navigator.clipboard) {
		// Fallback for older browsers
		var textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		try {
			document.execCommand('copy');
			showCopyFeedback(btnId);
		} catch (err) {
			console.error('Fallback: Oops, unable to copy', err);
		}
		document.body.removeChild(textArea);
		return;
	}
	navigator.clipboard.writeText(text).then(function () {
		showCopyFeedback(btnId);
	}, function (err) {
		console.error('Async: Could not copy text: ', err);
	});
}

function showCopyFeedback(btnId) {
	var btn = gebi(btnId);
	if (!btn) return;

	var originalHTML = btn.innerHTML;
	var isInteractionItem = btn.classList.contains('interaction-item');

	if (isInteractionItem) {
		btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--color-primary);"></i> <span class="interaction-label">Copied!</span>';
	} else {
		btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
	}

	setTimeout(function () {
		btn.innerHTML = originalHTML;
	}, 2000);
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

function lsg(n) {
	return localStorage.getItem(n);
}
function lss(n, v) {
	return localStorage.setItem(n, v);
}
function gebi(id) { return document.getElementById(id); }

function getVerifiedBadge(level, style = "", customTitle = null) {
	if (level <= 0) return "";
	let icon = "fa-badge-check";
	let title = customTitle || i18n.t("lang_badge_" + level) || i18n.t("lang__016");
	if (level == 20) icon = "fa-paw-claws";

	return `<i class="fa-solid ${icon} verified_color_${level} verified-badge" style="${style}" title="${title}"></i>`;
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

function _revoke_all_sessions(confirmed = false) {
	if (!confirmed) {
		_confirm_modal("Are you sure you want to log out from ALL other devices? This action cannot be undone.", "_revoke_all_sessions(true)");
		return;
	}

	$.post(backend_url + "Auth.php", { action: 'revoke_session', revoke_all: 1 }, function (response) {
		if (response.success === 1) {
			_load_sessions(); // Refresh list
			_alert_modal("All other sessions have been revoked.");
		} else {
			_alert_modal("Failed to revoke sessions: " + (response.error || "Unknown error"));
		}
	});
}

function _pin_post(postId) {
	togglePostOptions(postId);
	$.post(backend_url + "Post.php", { action: 'pin', post_id: postId }, function (r) {
		if (r.success === 1) {
			const postEl = gebi('post_id-' + postId);
			if (!postEl) {
				location.reload(); // Fallback if element not found
				return;
			}

			// Clear ANY existing pinned state in the feed visually
			$('.pinned-label').remove();
			$('.post-options-item .fa-thumbtack').siblings('span').text('Pin Post');

			if (r.status === 'pinned') {
				// 1. Add indicator to this post
				let pinLabel = i18n.t("lang__087") || "Pinned Post";
				let pinHtml = '<div class="pinned-label" style="font-size:0.85rem; color:var(--color-text-dim); margin-bottom: 8px; margin-left:2px;"><i class="fa-solid fa-thumbtack" style="transform:rotate(45deg); margin-right:5px;"></i> ' + pinLabel + '</div>';
				$(postEl).prepend(pinHtml);

				// 2. Update menu label for THIS post
				$(postEl).find('.post-options-item .fa-thumbtack').siblings('span').text('Unpin Post');

				// 3. Move to top if on Profile or Group page
				const u = window.location.pathname;
				if (u.includes('profile.php') || u.includes('group.php')) {
					$('#feed').prepend(postEl);
				}
			} else {
				// Unpinned - we already cleared indicators above
				// If it was at the top, it stays there until refresh or we could try to move it back,
				// but that's complex without knowing original order. Leaving it is fine.
			}
		} else {
			_alert_modal(r.err || "Failed to pin post.");
		}
	});
}

function _delete_post(postId, confirmed = false) {
	if (!confirmed) {
		_confirm_modal("Are you sure you want to delete this post?", "_delete_post(" + postId + ", true)");
		return;
	}

	$.post(backend_url + "Post.php", { action: 'delete', post_id: postId }, function (r) {
		if (r.success === 1) {
			const post = gebi('post_id-' + postId);
			if (post) post.remove();
			// If in modal, close it
			if (gebi('modal').style.display === 'flex') modal_close();
		} else {
			_alert_modal(r.err || "Failed to delete post.");
		}
	});
}

function _open_edit_post(postId) {
	togglePostOptions(postId); // Close the menu
	$.get(backend_url + "Post.php?scope=single&id=" + postId, function (data) {
		if (data.success === 1) {
			modal_open('edit_post', postId);
			var content = gebi("modal_content");
			var h = '';
			h += '<div class="upload-modal-container" style="max-width:550px;">';
			h += '<div class="upload-modal-header"><h2>Edit Post</h2><i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i></div>';
			h += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			h += '<div style="margin-bottom:15px;">';
			h += '<label class="input-label">Caption</label>';
			h += '<textarea id="edit_caption" class="index_input_box" style="height:120px; font-size:1.1rem;">' + data.post_caption + '</textarea>';
			h += '</div>';

			h += '<div style="margin-bottom:15px;">';
			h += '<label class="input-label">Privacy</label>';
			h += '<select id="edit_privacy" class="index_input_box" style="width:100%;">';
			h += '<option value="2" ' + (data.post_public == 2 ? 'selected' : '') + '>' + i18n.t("lang__002") + '</lang></option>';
			h += '<option value="1" ' + (data.post_public == 1 ? 'selected' : '') + '>' + i18n.t("lang__004") + '</lang></option>';
			h += '<option value="0" ' + (data.post_public == 0 ? 'selected' : '') + '>' + i18n.t("lang__003") + '</lang></option>';
			h += '</select>';
			h += '</div>';

			h += '</div>';
			h += '<div class="upload-modal-footer">';
			h += '<button class="btn-primary" onclick="_submit_post_edit(' + postId + ')">Save Changes</button>';
			h += '</div>';
			h += '</div>';
			content.innerHTML = h;

			// Resize textarea
			const ta = gebi('edit_caption');
			if (ta) {
				ta.style.height = '0px';
				ta.style.height = ta.scrollHeight + 'px';
			}
		}
	});
}

function _submit_post_edit(postId) {
	const caption = gebi('edit_caption').value;
	const privacy = gebi('edit_privacy').value;
	$.post(backend_url + "Post.php", { action: 'update', post_id: postId, caption: caption, private: privacy }, function (r) {
		if (r.success === 1) {
			modal_close();
			// Refresh feed or update DOM
			// For now, let's just refresh the post if we are in SPA
			fetch_post("Post.php?scope=feed");
		} else {
			_alert_modal(r.err || "Failed to update post.");
		}
	});
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
		r[0].innerHTML = i18n.t("lang__007");
		return false;
	} else if (isNaN(n)) {
		r[0].innerHTML = i18n.t("lang__008");
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
		url: backend_url + "User.php?action=settings",
		type: 'GET',
		success: function (res) {
			gebi('online_status').value = res['online_status'];
			gebi('fullname').value = res['user_firstname'] + ' ' + res['user_lastname'];
		}
	});
}
function _like(id) {
	$.post(backend_url + "Post.php", { action: 'like', post_id: id }, function (d) {
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
	var titleTags = e.getElementsByTagName('title');
	tl = (titleTags.length > 0) ? titleTags[0].innerHTML : "";
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
	if (tl) document.title = tl;
	window.history.pushState({
		"html": r,
		"pageTitle": tl
	}, "", u);

	const mainContainer = gebcn('container')[0];
	if (!mainContainer) {
		console.warn("Target .container not found in current page.");
		loading_bar(0);
		return;
	}

	if (c.length > 0) {
		if (u.substring(0, 12) === "/profile.php" || u.substring(0, 11) === "profile.php") {
			_feedLoading = false;
			window['xel'] = e;
			mainContainer.innerHTML = c[0].innerHTML;

			// fetch_profile will handle loading posts after profile header is ready
			fetch_profile(e);
		} else {
			mainContainer.innerHTML = c[0].innerHTML;
		}
	} else {
		console.warn("New content does not contain a .container element.");
		// Fallback: If it's a full page but without our SPA structure, just reload it?
		// Or inject the body. For now, we do nothing and let the user see the console error/warning
	}

	loading_bar(0);
	if (u.substring(0, 13) === "/settings.php" || u.substring(0, 12) === "settings.php") {
		_load_settings();
	}
	// Reset feed loading state on navigation to prevent locks
	_feedLoading = false;

	if (u === "/home.php" || u === "home.php" || u === "/" || u === "/index.php" || u === "index.php")
		fetch_post("Post.php?scope=feed", true);
	if (u === "/logout.php" || u === "logout.php")
		location.reload();
	if (u === "/friends.php" || u === "friends.php")
		initFriendsPage();
	if (u === "/notification.php" || u === "notification.php")
		loadNotifications();
	if (u.indexOf("/groups.php") === 0 || u.indexOf("groups.php") === 0)
		_load_groups_discovery();
	if (u.indexOf("/group.php") === 0 || u.indexOf("group.php") === 0)
		fetch_group();
	if (u.substring(0, 9) === "/post.php" || u.substring(0, 8) === "post.php") {
		if (u.substring(0, 13) === "/post.php?id=" || u.substring(0, 12) === "post.php?id=")
			_load_post(get("id"));
		else
			window.history.go(-1);
	}
	changeUrlWork();
	textAreaRework();
	updateActiveNavbar(u);
	initCustomSelects(); // Theming new content
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
			$.get(backend_url + "Account.php?action=profile_images", function (d) {
				if (d["pfp_media_id"] != i) lss("pfp_media_id", d["pfp_media_id"]);
				if (d["pfp_media_hash"] != h) lss("pfp_media_hash", d["pfp_media_hash"]);
				if (d["user_gender"] != g) lss("user_gender", d["user_gender"]);
			});
			b.src = (i > 0) ? pfp_cdn + '&id=' + (i != null ? i : lsg('pfp_media_id')) + "&h=" + (h != null ? h : lsg('pfp_media_hash')) : getDefaultUserImage((g != null ? g : lsg('user_gender')));
		}
	}
}
// Helper to generate Post HTML
function createPostHTML(s) {
	var a = "";
	var isShare = (s['is_share'] > 0);
	var post = isShare ? s['share'] : s;
	var postId = isShare ? s['share']['post_id'] : s['post_id'];
	var originalId = s['post_id'];

	a += '<div class="post" id="post_id-' + originalId + '">';

	// Pinned Indicator & Spoiler Badge
	if (s['is_pinned'] == 1 || s['is_spoiler'] == 1) {
		a += '<div style="display:flex; gap:10px; align-items:center; margin-bottom: 8px; margin-left:2px;">';
		if (s['is_pinned'] == 1) {
			a += '<div class="pinned-label" style="font-size:0.85rem; color:var(--color-text-dim);"><i class="fa-solid fa-thumbtack" style="transform:rotate(45deg); margin-right:5px;"></i> ' + (i18n.t("lang__087") || "Pinned Post") + '</div>';
		}
		a += '</div>';
	}

	a += '<div class="header">';

	// Left Side: PFP + User Info
	a += '<img class="pfp" src="';
	a += (s['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + s['pfp_media_id'] + "&h=" + s['pfp_media_hash'] : getDefaultUserImage(s['user_gender']);
	a += '" width="40px" height="40px">';

	a += '<div class="header-info">';
	// User Name
	a += '<div class="user_name">';
	a += '<a class="profilelink" href="profile.php?id=' + s['user_id'] + '">' + s['user_firstname'] + ' ' + s['user_lastname'] + '</a>';
	if (s['verified'] > 0)
		a += getVerifiedBadge(s['verified'], "margin-left:5px;");

	if (s.group_id > 0 && s.group_name) {
		a += ' <i class="fa-solid fa-caret-right" style="margin:0 5px; color:var(--color-text-dim); font-size:0.8em;"></i> ';
		a += '<a href="group.php?id=' + s.group_id + '" class="profilelink" onclick="changeUrl(\'group.php?id=' + s.group_id + '\'); return false;" style="color:var(--color-text-main); font-weight:600;">' + s.group_name + '</a>';
		if (s.group_verified > 0) a += getVerifiedBadge(s.group_verified, "margin-left:5px;", "Verified Community");
	}
	a += '</div>';

	// Meta
	a += '<div class="postedtime">';
	a += '<span class="nickname">@' + s['user_nickname'] + '</span>';
	a += ' • ';
	a += '<span title="' + timeConverter(s['post_time'] * 1000) + '">' + timeSince(s['post_time'] * 1000) + '</span>';
	a += ' • ';
	switch (Number(s['post_public'])) {
		case 2: a += '<i class="fa-solid fa-earth-americas" title="' + i18n.t("lang__002") + '"></i>'; break;
		case 1: a += '<i class="fa-solid fa-user-group" title="' + i18n.t("lang__004") + '"></i>'; break;
		default: a += '<i class="fa-solid fa-lock" title="' + i18n.t("lang__003") + '"></i>'; break;
	}
	a += '</div>'; // End Meta
	a += '</div>'; // End header-info

	// Right Side: Options Menu (3-dot)
	var postUrl = window.location.origin + '/post.php?id=' + originalId;
	a += '<div class="post-options-container">';
	a += '  <div class="post-options-btn" onclick="togglePostOptions(' + originalId + ')"><i class="fa-solid fa-ellipsis"></i></div>';
	a += '  <div class="post-options-menu" id="post-options-menu-' + originalId + '">';

	// Pin Option Logic
	var showPin = false;
	var pinLabel = (s['is_pinned'] == 1) ? "Unpin Post" : "Pin Post";
	if (s['group_id'] == 0 && s['is_mine'] == 1) showPin = true;
	if (s['group_id'] > 0 && s['can_pin'] == 1) showPin = true;

	if (showPin) {
		a += '    <div class="post-options-item" onclick="_pin_post(' + originalId + ')"><i class="fa-solid fa-thumbtack"></i><span>' + pinLabel + '</span></div>';
		a += '    <div class="menu-divider"></div>';
	}

	a += '    <div class="post-options-item" onclick="copyToClipboard(\'' + postUrl + '\', \'copy-btn-feed-' + originalId + '\'); togglePostOptions(' + originalId + ')">';
	a += '      <i class="fa-regular fa-link"></i><span>Copy Link</span><span id="copy-btn-feed-' + originalId + '" style="display:none"></span>';
	a += '    </div>';

	if (s['is_mine'] == 1 || s['can_delete'] == 1) {
		a += '    <div class="menu-divider"></div>';
		if (s['is_mine'] == 1) {
			a += '    <div class="post-options-item" onclick="_open_edit_post(' + originalId + ')"><i class="fa-regular fa-pen-to-square"></i><span>Edit Post</span></div>';
		}
		if (s['is_mine'] == 1 || s['can_delete'] == 1) {
			a += '    <div class="post-options-item" style="color: #ff4d4d;" onclick="_delete_post(' + originalId + ')"><i class="fa-regular fa-trash-can"></i><span>Delete Post</span></div>';
		}
	}
	a += '  </div></div>';

	a += '</div>'; // End header
	a += '<br>';

	// --- Content Rendering ---
	if (isShare) {
		var pflag = s['share']["pflag"];
		if (pflag) {
			a += '<div class="share-post" id="post_id-' + postId + '">';
			a += '<div class="header">';
			a += '<img class="pfp" src="';
			a += (post['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + post['pfp_media_id'] + "&h=" + post['pfp_media_hash'] : getDefaultUserImage(post['user_gender']);
			a += '" width="40px" height="40px">';
			a += '<div class="header-info">';
			a += '<div class="user_name"><a class="profilelink" href="profile.php?id=' + post['user_id'] + '">' + post['user_firstname'] + ' ' + post['user_lastname'] + '</a>';
			if (post['verified'] > 0) a += getVerifiedBadge(post['verified'], "margin-left:5px;");
			a += '</div>';
			a += '<div class="postedtime"><span class="nickname">@' + post['user_nickname'] + '</span> • <span title="' + timeConverter(post['post_time'] * 1000) + '">' + timeSince(post['post_time'] * 1000) + '</span></div>';
			a += '</div></div><br>';
			a += renderPostContent(post, true);
			a += '</div>';
		} else {
			a += '<div class="share-post"><p style="font-size: 150%;text-align: center">' + i18n.t("lang__013") + '</p></div>';
		}
	} else {
		a += renderPostContent(s, false);
	}

	a += '<br>';

	// --- Actions Bar ---
	var interactionId = isShare ? originalId : originalId;
	var likedClass = (s['is_liked'] == 1) ? 'p-heart fa-solid' : 'white-col fa-regular';

	a += '<div class="bottom"><div class="reaction-bottom">';
	a += '<div class="reaction-box likes" onclick="_like(' + originalId + ')">';
	a += '<i class="' + likedClass + ' icon-heart fa-heart icon-click" id="post-like-' + originalId + '"></i>';
	a += ' <a z-var="counter call roller" id="post-like-count-' + originalId + '">' + s['total_like'] + '</a>';
	a += '</div>';
	a += '<div class="reaction-box comment" onclick="_open_post(' + originalId + ')">';
	a += '<i class="fa-regular fa-comment icon-click" id="post-comment-' + originalId + '"></i>';
	a += ' <a z-var="counter call roller" id="post-comment-count-' + originalId + '">' + s['total_comment'] + '</a>';
	a += '</div>';

	var shareTargetId = isShare ? s['share']['post_id'] : s['post_id'];
	var canShare = true;
	if (isShare && !s['share']['pflag']) canShare = false;

	if (canShare) {
		a += '<div class="reaction-box share" onclick="_share(' + shareTargetId + ')">';
		a += '<i class="fa-regular fa-share icon-click" id="post-share-' + originalId + '"></i>';
		a += ' <a z-var="counter call roller" id="post-share-count-' + originalId + '">' + s['total_share'] + '</a>';
		a += '</div>';
	}
	a += '</div></div></div></br>';
	return a;
}

// Helper to render caption and media
function renderPostContent(post, isSharedRender) {
	var h = "";
	var suffix = isSharedRender ? 'shd' : ''; // Suffix for IDs to prevent duplicate IDs if same post rendered twice? (Unlikely in feed but good practice)

	// Caption
	// Logic for "See More" based on length
	var lines = post['post_caption'].split(/\r\n|\r|\n/).length;
	var len = post['post_caption'].length;
	var hasMedia = (post['post_media'] != 0 || (post['post_media_list'] && post['post_media_list'].length > 0));
	var showMore = false;

	// Thresholds
	if (hasMedia) {
		if (lines > 13 || len > 1196) showMore = true;
	} else {
		if (post['is_share'] == 0 && post['post_caption'].replace(/^\s+|\s+$/gm, '').length < 20) {
			// Big text logic... keeping simple for now, standardizing
		}
		if (lines > 13 || len > 1196) showMore = true;
	}

	if (showMore) {
		h += '<div class="caption_box" id="caption_box-' + post['post_id'] + suffix + '">';
		h += '<div class="caption_box_shadow" id="caption_box_shadow-' + post['post_id'] + suffix + '"><p onclick="showMore(\'' + post['post_id'] + suffix + '\')">' + i18n.t("lang__014") + '</p></div>';
	} else {
		h += '<div class="caption_box" style="height: 100%">';
	}

	var captionStyle = (!hasMedia && post['post_caption'].length < 20 && !isSharedRender) ? 'style="font-size: 300%"' : '';
	h += '<pre class="caption" ' + captionStyle + '>' + post['post_caption'] + '</pre></div>';

	// Media
	var mediaHtml = "";
	if (post['post_media_list']) {
		mediaHtml = renderMedia(post['post_media_list']);
	} else if (post['post_media'] != 0) {
		// Fallback for single media legacy
		mediaHtml += '<center>';
		if (post['is_video'])
			mediaHtml += '<video style="max-height:500px; max-width: 100%" src="data/empty.mp4" type="video/mp4" id="video_pid-' + post['post_id'] + suffix + '" controls></video>';
		else
			mediaHtml += '<img src="' + media_cdn + "&id=" + post['post_media'] + "&h=" + post['media_hash'] + '" style="max-width:100%;">';
		mediaHtml += '</center>';
	}

	if (post['is_spoiler'] == 1 && mediaHtml != "") {
		h += '<div class="blurred-media-container" onclick="this.classList.add(\'revealed\')">';
		h += '<div class="spoiler-overlay">';
		h += '<i class="fa-solid fa-eye-slash"></i>';
		h += '<div class="spoiler-text">Spoiler Content</div>';
		h += '<button class="btn-view-spoiler">View Content</button>';
		h += '</div>';
		h += mediaHtml;
		h += '</div>';
	} else {
		h += mediaHtml;
	}

	return h;
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
		$.get(backend_url + "User.php?action=profile", function (data) {
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
				h += '<div style="margin-bottom:20px;">';
				h += '<label class="input-label">Gender</label>';
				h += '<div style="display:flex; gap:25px; margin-top:8px;">';
				h += '<label style="cursor:pointer; display:flex; align-items:center; gap:8px;"><input type="radio" name="usergender" class="usergender" value="M" ' + (data.user_gender == 'M' ? 'checked' : '') + '> Male</label>';
				h += '<label style="cursor:pointer; display:flex; align-items:center; gap:8px;"><input type="radio" name="usergender" class="usergender" value="F" ' + (data.user_gender == 'F' ? 'checked' : '') + '> Female</label>';
				h += '<label style="cursor:pointer; display:flex; align-items:center; gap:8px;"><input type="radio" name="usergender" class="usergender" value="U" ' + (data.user_gender == 'U' ? 'checked' : '') + '> Other</label>';
				h += '</div>';
				h += '</div>';

				// Relationship Status
				h += '<div style="margin-bottom:15px; display:flex; gap:15px;">';
				h += '  <div style="flex:1;">';
				h += '    <label class="input-label">Relationship Status</label>';
				h += '    <select id="userstatus" class="index_input_box" onchange="_toggleRelationshipPartner(this.value)">';
				h += '      <option value="N" ' + (data.user_status == 'N' ? 'selected' : '') + '>Not specified</option>';
				h += '      <option value="S" ' + (data.user_status == 'S' ? 'selected' : '') + '>Single</option>';
				h += '      <option value="L" ' + (data.user_status == 'L' ? 'selected' : '') + '>In a relationship</option>';
				h += '      <option value="E" ' + (data.user_status == 'E' ? 'selected' : '') + '>Engaged</option>';
				h += '      <option value="M" ' + (data.user_status == 'M' ? 'selected' : '') + '>Married</option>';
				h += '      <option value="D" ' + (data.user_status == 'D' ? 'selected' : '') + '>Divorced</option>';
				h += '      <option value="U" ' + (data.user_status == 'U' ? 'selected' : '') + '>Widowed</option>';
				h += '    </select>';
				h += '  </div>';

				var showPartner = (['L', 'E', 'M'].indexOf(data.user_status) !== -1);
				h += '  <div style="flex:1; ' + (showPartner ? '' : 'display:none;') + '" id="partner_selector_container">';
				h += '    <label class="input-label">Partner</label>';
				h += '    <select id="relationship_user_id" class="index_input_box">';
				h += '      <option value="0">None</option>';
				if (data.relationship_user_id > 0) {
					h += '<option value="' + data.relationship_user_id + '" selected>' + data.relationship_partner_name + '</option>';
				}
				h += '    </select>';
				h += '  </div>';
				h += '</div>';

				if (showPartner) {
					setTimeout(() => { _loadFriendListForRelationship(data.relationship_user_id); }, 100);
				}

				h += '</div>'; // End Body

				h += '<div class="upload-modal-footer">';
				h += '<button class="btn-primary" onclick="_change_profile_infomation()">Save Changes</button>';
				h += '</div>';
				h += '</div>'; // End Container

				content.innerHTML = h;
				initCustomSelects();

				// Reset Styles
				content.style.padding = "0";
				content.style.background = "transparent";
				content.style.boxShadow = "none";
			}
		});
	} else if (type === '2fa_setup') {
		$.get(backend_url + "Auth.php?action=2fa_setup", function (r) {
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
				initCustomSelects();
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
		initCustomSelects();
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
		initCustomSelects();
		// Ensure modal content can expand for ultra-wide support
		const modalContent = gebi('modal-content');
		modalContent.style.maxWidth = '1200px';
		modalContent.style.width = '95%';
	} else if (type === 'create_group') {
		var h = '';
		h += '<div class="upload-modal-container">';
		h += '<div class="upload-modal-header">';
		h += '<h2>Create New Group</h2>';
		h += '<i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i>';
		h += '</div>';
		h += '<div class="upload-modal-body" style="padding:25px; display:flex; flex-direction:column; gap:20px;">';
		h += '  <div>';
		h += '    <label class="input-label">Group Name</label>';
		h += '    <input type="text" id="group_create_name" class="index_input_box" placeholder="What is your community called?">';
		h += '  </div>';
		h += '  <div>';
		h += '    <label class="input-label">Description (About)</label>';
		h += '    <textarea id="group_create_about" class="index_input_box" style="height:100px;" placeholder="Tell people what this group is about..."></textarea>';
		h += '  </div>';
		h += '  <div>';
		h += '    <label class="input-label">Privacy</label>';
		h += '    <select id="group_create_privacy" class="index_input_box">';
		h += '      <option value="2">Public (Anyone can see and join)</option>';
		h += '      <option value="1">Closed (Anyone can find it, but joining requires approval)</option>';
		h += '      <option value="0">Secret (Only members can find it)</option>';
		h += '    </select>';
		h += '  </div>';
		h += '</div>';
		h += '<div class="upload-modal-footer">';
		h += '  <button class="btn-primary" onclick="_create_group()" style="width:100%; padding:12px 0; font-size:1.1em;">Create Community</button>';
		h += '</div>';
		h += '</div>';
		content.innerHTML = h;
		initCustomSelects();
	}
}
// Replaced _load_comment and _load_next_comment_page
function loadComments(postId, page = -1, reset = false) {
	var list = gebi("comment-list");
	if (!list) return; // Element doesn't exist, nothing to do

	var lmcContainer = gebi("load-more-comments-container");
	var btn = lmcContainer ? lmcContainer.querySelector('button') : null;

	// Manage Page State
	var pageInput = gebi('page');
	if (!pageInput) {
		// Create hidden input if doesn't exist to track page
		pageInput = document.createElement('input');
		pageInput.type = 'hidden';
		pageInput.id = 'page';
		pageInput.value = 0;
		document.body.appendChild(pageInput);
	}

	if (reset) {
		page = 0;
		list.innerHTML = '';
		if (lmcContainer) lmcContainer.style.display = 'none';
		pageInput.value = 0;
	} else {
		if (page === -1) page = parseInt(pageInput.value) + 1;
	}

	// Loading State
	if (btn) {
		btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';
		btn.disabled = true;
		btn.style.opacity = '0.7';
		btn.style.pointerEvents = 'none';
	}

	$.get(backend_url + "Post.php?scope=comments&id=" + postId + "&page=" + page, function (data) {

		// Reset Button State
		if (btn) {
			btn.innerHTML = 'Load more comments';
			btn.disabled = false;
			btn.style.opacity = '1';
			btn.style.pointerEvents = 'auto';
		}

		if (data['success'] == 2) {
			// No comments found
			if (reset) {
				list.innerHTML = '<div class="empty-comments-state"><i class="fa-light fa-comments"></i><p>No comments yet. Be the first to join the conversation!</p></div>';
			} else {
				// No more comments to load
				if (lmcContainer) lmcContainer.style.display = 'none';
			}
			return;
		}

		if (data['success'] == 1) {
			var count = 0;
			var html = '';

			// Iterate numeric keys
			for (let i = 0; i < (Object.keys(data).length - 1); i++) { // -1 for success key
				if (!data[i] || typeof data[i] !== 'object') continue;
				count++;

				html += '<div class="comment-item" style="animation-delay: ' + (i * 0.05) + 's">';
				html += '<img class="comment-pfp" src="';
				html += (data[i]['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] : getDefaultUserImage(data[i]['user_gender']);
				html += '">';

				html += '<div class="comment-bubble">';
				html += '<div class="comment-header">';
				html += '<a class="comment-user" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if (data[i]['verified'] > 0)
					html += getVerifiedBadge(data[i]['verified'], "margin-left:4px; font-size: 11px;");
				html += '</a>';
				html += '<span class="comment-time" title="' + timeConverter(data[i]['comment_time'] * 1000) + '">' + timeSince(data[i]['comment_time'] * 1000) + '</span>';
				html += '</div>';
				html += '<div class="comment-content">' + data[i]['comment'].replace(/\n/g, '<br>') + '</div>';
				html += '</div>'; // End bubble
				html += '</div>'; // End item
			}

			// Append or Set
			if (reset) {
				list.innerHTML = html;
			} else {
				// Use robust appending instead of innerHTML += to preserve event listeners (though none here yet)
				// innerHTML += is fine for simple content, but let's use insertAdjacentHTML for better performance
				list.insertAdjacentHTML('beforeend', html);
			}

			// Update Page Tracker
			pageInput.value = page;

			// Manage Load More Visibility
			if (lmcContainer) {
				if (count >= 10) {
					// Assuming limit is 10 per page. 
					// Ideally backend should return "has_more" or similar.
					// For now, if we got a full page, show button.
					lmcContainer.style.display = 'block';
					// Update onclick to load next page specifically? 
					// No, the function uses pageInput value automatically if -1 passed
				} else {
					lmcContainer.style.display = 'none';
				}
			}
		}
	}).fail(function () {
		if (btn) {
			btn.innerHTML = 'Error loading. Try again.';
			btn.disabled = false;
			btn.style.opacity = '1';
			btn.style.pointerEvents = 'auto';
		}
	});
}

function _share(id) {
	gebtn('body')[0].style.overflowY = "hidden";
	$.get(backend_url + "Post.php?scope=single&id=" + id, function (s) {
		gebi("modal").style.display = "block";

		// Clear DataTransfer on new share
		dt = new DataTransfer();

		a = "";
		a += '<div class="modal-box-container" style="max-width: 550px; margin: 0; padding: 25px;">';
		a += '<div class="share-modal-title">' + i18n.t("lang__093") + '</div>';

		a += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">';
		a += '<div class="modal-header-user">';
		a += '<img class="modal-user-pfp" src="' + gebi('pfp_box').src + '">';
		a += '<span class="modal-user-name">' + gebi('fullname').value + '</span>';
		a += '</div>';
		a += '<div id="privacy_selector_container" style="display: block;">';
		a += '<select name="private" id="private" class="modal-privacy-select">';
		a += '<option value="2">' + i18n.t("lang__002") + '</option>';
		a += '<option value="1">' + i18n.t("lang__004") + '</option>';
		a += '<option value="0">' + i18n.t("lang__003") + '</option>';
		a += '</select>';
		a += '</div>';
		a += '</div>';

		// Group selector
		a += '<div style="margin-bottom: 15px;">';
		a += '<label class="input-label" style="display: block; margin-bottom: 8px; font-size: 0.9rem; color: var(--color-text-secondary);">Share to Group (Optional)</label>';
		a += '<select name="share_group_id" id="share_group_id" class="modal-privacy-select" style="width: 100%">';
		a += '<option value="0">Your Timeline</option>';
		a += '</select>';
		a += '</div>';

		// Info message about public post requirement
		var postPublic = s['post_public'];
		a += '<div id="share_group_warning" style="display:none; background: rgba(255,193,7,0.1); border-left: 3px solid #ffc107; padding: 10px; margin-bottom: 15px; font-size: 0.85rem; color: var(--color-text-secondary);">';
		a += '<i class="fa-solid fa-info-circle" style="margin-right: 5px; color: #ffc107;"></i>';
		a += 'Only public posts can be shared to groups.';
		a += '</div>';

		a += '<input type="hidden" name="post_id" id="post_id" value="' + id + '">';
		a += '<input type="hidden" name="original_post_public" id="original_post_public" value="' + postPublic + '">';
		a += '<textarea rows="3" name="caption" class="caption" placeholder="' + i18n.t("lang__094") + '" style="width:100%; border:none; background:transparent; font-size:1.1rem; resize:none; outline:none;"></textarea>';
		// Multi-upload preview for share
		a += '<div id="media-preview-container" class="media-preview-grid"></div>';

		// Upload Progress
		a += '<div id="upload-progress-container"><div id="upload-progress-bar"></div></div>';

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
		initCustomSelects();

		$.get(backend_url + "Group.php?action=list&joined=1", function (groups) {
			var groupSelect = gebi("share_group_id");
			if (!groupSelect) {
				return;
			}

			if (groups && Array.isArray(groups) && groups.length > 0) {
				while (groupSelect.options.length > 1) {
					groupSelect.remove(1);
				}

				var addedCount = 0;
				for (var i = 0; i < groups.length; i++) {
					if (groups[i].my_status == 1) { // Only joined groups
						var option = document.createElement("option");
						option.value = groups[i].group_id;
						option.text = groups[i].group_name;
						groupSelect.appendChild(option);
						addedCount++;
					}
				}

				var customDropdown = groupSelect.parentElement.querySelector('.custom-select-dropdown');
				if (customDropdown) {
					while (customDropdown.children.length > 1) {
						customDropdown.removeChild(customDropdown.lastChild);
					}

					// Add new options to custom dropdown
					for (var j = 0; j < groups.length; j++) {
						if (groups[j].my_status == 1) {
							var customOption = document.createElement('div');
							customOption.className = 'custom-select-option';
							customOption.setAttribute('data-value', groups[j].group_id);
							customOption.textContent = groups[j].group_name;
							customDropdown.appendChild(customOption);

							// Add click handler
							customOption.addEventListener('click', function () {
								var container = this.closest('.custom-select-container');
								var triggerSpan = container.querySelector('.custom-select-trigger span');

								// Native select is the previous sibling of the container
								var select = container.previousElementSibling;
								if (!select || select.id !== "share_group_id") {
									select = gebi("share_group_id"); // Fallback to ID
								}

								if (select) {
									select.value = this.getAttribute('data-value');
									if (triggerSpan) triggerSpan.textContent = this.textContent;

									container.querySelectorAll('.custom-select-option').forEach(function (opt) {
										opt.classList.remove('selected');
									});
									this.classList.add('selected');
									container.classList.remove('open');

									// Trigger change event for validation
									var event = new Event('change', { bubbles: true });
									select.dispatchEvent(event);
								}
							});
						}
					}
				}
			}
		});

		// Add change listener to show/hide warning and privacy selector
		gebi("share_group_id").addEventListener("change", function () {
			var groupId = this.value;
			var postPublic = gebi("original_post_public").value;
			var warning = gebi("share_group_warning");
			var privacyContainer = gebi("privacy_selector_container");

			if (groupId > 0) {
				if (postPublic != "2") {
					warning.style.display = "block";
				} else {
					warning.style.display = "none";
				}
				// Hide privacy selector when sharing to group
				if (privacyContainer) privacyContainer.style.display = "none";
			} else {
				warning.style.display = "none";
				// Show privacy selector when sharing to timeline
				if (privacyContainer) privacyContainer.style.display = "block";
			}
		});

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
			a += i18n.t("lang__010");
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
					a += getVerifiedBadge(data[i]['verified']);
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
			a += i18n.t("lang__011");
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
					a += getVerifiedBadge(data[i]['verified']);
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
// Initialize Friends Page with Tabs
function initFriendsPage() {
	load_lang();
	// Load friends list on page load
	fetch_friend_list('User.php?action=friends');

	// Load request count for badge
	$.get(backend_url + 'User.php?action=requests&type=count', function (data) {
		if (data && data.count > 0) {
			$('#request-count-badge').text(data.count).show();
		} else {
			$('#request-count-badge').hide();
		}
	});

	// Tab switching logic
	$('.friends-tab').off('click').on('click', function () {
		var tab = $(this).data('tab');

		// Update active tab
		$('.friends-tab').removeClass('active');
		$(this).addClass('active');

		// Update active content
		$('.friends-content').removeClass('active');
		$('#' + tab + '-content').addClass('active');

		// Load content if not already loaded
		if (tab === 'requests' && $('#friend_reqest_list').children().length === 0) {
			fetch_friend_request('fetch_friend_request.php');
		}
	});
}
// Global storage for current viewing profile
var _currentProfileData = null;

function fetch_profile(e = null) {
	// Use async for better UX and to allow DOM to update first in SPA mode
	id = get("id");
	id_a = '';
	if (typeof (id) != 'undefined')
		id_a = '?id=' + id;

	// Note: We do not modify 'e' (the temp DOM) here because we want to load data asynchronously.
	// The skeleton from profile.php will be injected by processAjaxData first.

	$.get(backend_url + "User.php?action=profile" + ((id_a) ? '&' + id_a.substring(1) : ''), function (data) {
		if (data['success'] != 1) {
			// If user not found, maybe redirect or show error
			if (window.location.href.indexOf("profile.php") > -1) {
				// window.history.go(-1); // Can cause loops if not careful
			}
			return;
		}

		_currentProfileData = data; // Store globally

		// Find the mount point in the REAL DOM, not the detached 'e'
		// This ensures compatibility with both direct load and SPA
		var mount = gebi("profile-header-mount");

		if (!mount) {
			// Element missing (user navigated away?)
			return;
		}

		// Render Profile Header
		mount.innerHTML = _render_profile_header(data);

		changeUrlWork();
		onResizeEvent();

		// Fetch posts after profile header is rendered
		// Default to Timeline tab
		switchProfileTab('timeline', id_a);
	});
}

function _render_profile_header(data) {
	var h = '';
	h += '<div class="profile-header-card">';

	// --- Cover ---
	var coverUrl = (data['cover_media_id'] > 0) ? pfp_cdn + '&id=' + data['cover_media_id'] + '&h=' + data['cover_media_hash'] : '';
	var coverStyle = (coverUrl != '') ? ' style="background-image: url(\'' + coverUrl + '\')"' : '';
	h += '<div class="profile-cover-banner" id="profile_cover"' + coverStyle + '>';
	if (data['flag'] == 0) { // If own profile
		h += '<div class="profile-cover-edit-btn" onclick="_change_picture(1)"><i class="fa-solid fa-camera"></i> Edit Cover</div>';
	}
	h += '</div>';

	// --- Info Section ---
	h += '<div class="profile-info-section">';

	// Header Top (PFP + Actions)
	h += '<div class="profile-header-top">';

	// PFP
	h += '<div class="profile-pfp-container">';
	var pfpUrl = (data['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] : getDefaultUserImage(data['user_gender']);
	h += '<img class="profile-pfp-img" id="profile_image" src="' + pfpUrl + '">';
	if (data['flag'] == 0) {
		h += '<div class="profile-pfp-edit-btn" onclick="_change_picture(0)"><i class="fa-solid fa-camera"></i></div>';
	}
	h += '</div>';

	// Actions Bar
	h += '<div class="profile-actions-bar">';
	if (data['flag'] == 0) { // Own profile (0 = Me)
		// Edit - Removed as per user request (moved to About tab)
	} else {
		// Friend Button
		if (data['friendship_status'] != null) {
			var btnTxt = (data['friendship_status'] == 1) ? 'Friends' : window["lang__005"]; // 005 = Requested?
			// Using smaller inline styling for specific button types if needed, or classes
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
	h += '</div>'; // End Header Top

	// Names
	h += '<div class="profile-names">';
	h += '<div class="profile-fullname">';
	h += data['user_firstname'] + ' ' + data['user_lastname'];
	if (data['verified'] > 0)
		h += ' ' + getVerifiedBadge(data['verified']);
	h += '</div>';
	h += '<div class="profile-username">@' + data['user_nickname'] + '</div>';
	h += '</div>';

	// Bio
	if (data['user_about'] != '') {
		h += '<div class="profile-bio-text">' + data['user_about'] + '</div>';
	}

	// Meta info
	h += '<div class="profile-bio-meta">';
	if (data['user_gender'] == "M") h += '<span><i class="fa-solid fa-mars"></i> ' + window['lang__030'] + '</span>';
	else if (data['user_gender'] == "F") h += '<span><i class="fa-solid fa-venus"></i> ' + window['lang__031'] + '</span>';

	h += '<span><i class="fa-solid fa-cake-candles"></i> ' + birthdateConverter(data['user_birthdate'] * 1000) + '</span>';

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
		if (data['relationship_user_id'] > 0 && data['relationship_partner_name']) {
			statusText += ' with <a href="profile.php?id=' + data['relationship_user_id'] + '" onclick="route(event, this)" style="color:var(--color-text-primary); font-weight:600; text-decoration:none;">' + data['relationship_partner_name'] + '</a>';
		}
		h += '<span><i class="fa-solid fa-heart"></i> ' + statusText + '</span>';
	}

	if (data['user_hometown'] != '') {
		h += '<span><i class="fa-solid fa-location-dot"></i> ' + data['user_hometown'] + '</span>';
	}
	h += '</div>';

	// Stats Row
	h += '<div class="profile-stat-row">';
	h += '<div class="profile-stat-item">';
	h += '<span class="profile-stat-value">' + round_number(data['total_following']) + '</span>';
	h += '<span class="profile-stat-label">Following</span>';
	h += '</div>';
	h += '<div class="profile-stat-item">';
	h += '<span class="profile-stat-value">' + round_number(data['total_follower']) + '</span>';
	h += '<span class="profile-stat-label">Followers</span>';
	h += '</div>';
	h += '</div>';

	// Tabs
	h += '<div class="profile-nav-tabs">';
	h += '<div class="profile-tab-item active" onclick="switchProfileTab(\'timeline\', \'' + (id_a || '') + '\', this)">Timeline</div>';
	h += '<div class="profile-tab-item" onclick="switchProfileTab(\'about\', \'' + (id_a || '') + '\', this)">About</div>';
	h += '<div class="profile-tab-item" onclick="switchProfileTab(\'friends\', \'' + (id_a || '') + '\', this)">Friends</div>';
	h += '<div class="profile-tab-item" onclick="switchProfileTab(\'photos\', \'' + (id_a || '') + '\', this)">Photos</div>';
	if (data['flag'] == 0) {
		h += '<div class="profile-tab-item" onclick="switchProfileTab(\'likes\', \'' + (id_a || '') + '\', this)">Likes</div>';
	}
	h += '</div>';

	h += '</div>'; // End Info Section
	h += '</div>'; // End Card

	return h;
}

function switchProfileTab(tabName, id_a, tabElement) {
	// Track active tab globally so scroll handler knows not to load posts on other tabs
	_activeProfileTab = tabName;

	// Update Active Tab UI
	if (tabElement) {
		var tabs = document.querySelectorAll('.profile-tab-item');
		tabs.forEach(t => t.classList.remove('active'));
		tabElement.classList.add('active');
	}

	var oldFeed = gebi('feed');
	if (!oldFeed) return;

	// Reset loading flag to prevent lockout if user switches tabs rapidly
	if (typeof _feedLoading !== 'undefined') _feedLoading = false;

	// Explicitly clear content first (addressing user request + visual cleanup)
	oldFeed.innerHTML = '';

	// Replace the feed element to detach it from DOM.
	// This ensures that any pending fetch_post callbacks (which hold a reference to the old element)
	// will append to the detached element instead of the active UI, preventing race conditions.
	var feed = document.createElement('div');
	feed.id = 'feed';
	// Preserve any classes if needed, though usually #feed is bare
	feed.className = oldFeed.className;
	oldFeed.parentNode.replaceChild(feed, oldFeed);

	if (tabName === 'timeline') {
		feed.innerHTML = '<div id="profile-posts-container"></div>';

		var sep = (id_a && id_a.includes('?')) ? '&' : '?';
		fetch_post("Post.php" + (id_a || '') + sep + "scope=profile", true);

	} else if (tabName === 'about') {
		_load_profile_about();
	} else if (tabName === 'friends') {
		_load_profile_friends(id_a);
	} else if (tabName === 'photos') {
		_load_profile_photos(id_a);
	} else if (tabName === 'likes') {
		var sep = (id_a && id_a.includes('?')) ? '&' : '?';
		fetch_post("Post.php" + (id_a || '') + sep + "scope=liked", true);
	}
}

// Global storage for lightbox navigation
var _photoLightboxData = [];
var _photoLightboxIndex = 0;
var _photoLightboxPostId = null;

function _load_profile_about() {
	var feed = gebi('feed');
	var d = _currentProfileData;
	if (!d) {
		feed.innerHTML = '<div class="post"><div style="padding:20px; text-align:center; color:var(--color-text-secondary);">Error loading profile data.</div></div>';
		return;
	}

	var h = '<div class="profile-about-container">';

	if (d.flag == 0) {
		h += '<div style="margin-bottom:20px; text-align:right;">';
		h += '  <button class="btn-primary btn-sm" onclick="modal_open(\'settings\')"><i class="fa-solid fa-pen"></i> Edit About Info</button>';
		h += '</div>';
	}

	// Bio/About Section
	h += '<div class="about-card">';
	h += '  <div class="about-card-title"><i class="fa-solid fa-user"></i> About Me</div>';
	h += '  <div class="about-bio-text">' + (d.user_about || 'No description available.') + '</div>';
	h += '</div>';

	// Basic Info Section
	h += '<div class="about-card">';
	h += '  <div class="about-card-title"><i class="fa-solid fa-circle-info"></i> Basic Information</div>';
	h += '  <div class="about-info-grid">';

	// Gender
	var gender = 'N/A';
	if (d.user_gender === 'M') gender = 'Male';
	else if (d.user_gender === 'F') gender = 'Female';
	else if (d.user_gender === 'U') gender = 'Other';
	h += _render_about_item('fa-venus-mars', 'Gender', gender);

	// Birthday
	h += _render_about_item('fa-cake-candles', 'Birthday', birthdateConverter(d.user_birthdate * 1000));

	// Status
	var status = 'N/A';
	if (d.user_status && d.user_status !== 'N') {
		switch (d.user_status) {
			case "S": status = 'Single'; break;
			case "E": status = 'Engaged'; break;
			case "M": status = 'Married'; break;
			case "L": status = 'In a relationship'; break;
			case "D": status = 'Divorced'; break;
			case "U": status = 'Widowed'; break;
		}
	}

	var statusHtml = status;
	if (d.relationship_user_id > 0 && d.relationship_partner_name) {
		statusHtml += ' with <a href="profile.php?id=' + d.relationship_user_id + '" onclick="route(event, this)" style="color:var(--color-primary); font-weight:600;">' + d.relationship_partner_name + '</a>';
	}

	h += _render_about_item('fa-heart', 'Relationship Status', statusHtml);

	// Hometown
	h += _render_about_item('fa-location-dot', 'Hometown', d.user_hometown || 'Not specified');

	h += '  </div>'; // End Grid
	h += '</div>'; // End Card

	h += '</div>'; // End Container
	feed.innerHTML = h;
}

function _render_about_item(icon, label, value) {
	var item = '';
	item += '<div class="about-info-item">';
	item += '  <div class="about-info-icon"><i class="fa-solid ' + icon + '"></i></div>';
	item += '  <div class="about-info-content">';
	item += '    <span class="about-info-label">' + label + '</span>';
	item += '    <div class="about-info-value">' + value + '</div>';
	item += '  </div>';
	item += '</div>';
	return item;
}

function _load_profile_friends(id_a) {
	var feed = gebi('feed');
	// Initial skeleton
	feed.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>';

	$.get(backend_url + "User.php?action=friends" + ((id_a) ? '&' + id_a.substring(1) : ''), function (data) {
		if (_activeProfileTab !== 'friends') return;

		if (data.success == 2 || data.success == 3) {
			if (data.success == 2) feed.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-user-group fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>No friends to show yet.</p></div>';
			return;
		}

		var h = '<div class="profile-friend-grid">';
		var count = Object.keys(data).length - 1; // -1 for success key
		for (let i = 0; i < count; i++) {
			var f = data[i];
			var pUrl = f.pfp_media_hash ? media_cdn + "&id=" + f.pfp_media_id + "&h=" + f.pfp_media_hash : "data/images/U.png";
			h += '<a href="profile.php?id=' + f.user_id + '" class="friend-card" onclick="route(event, this)">';
			h += '  <img src="' + pUrl + '" class="friend-card-pfp">';
			h += '  <div class="friend-card-name">' + f.user_firstname + ' ' + f.user_lastname + (f.verified == 1 ? ' <i class="fa-solid fa-circle-check" style="color:var(--color-primary); font-size:0.8em;"></i>' : '') + '</div>';
			h += '  <div class="friend-card-username">@' + f.user_nickname + '</div>';
			h += '</a>';
		}
		h += '</div>';
		feed.innerHTML = h;
	});
}

function _load_profile_photos(id_a) {
	var feed = gebi('feed');
	// Initial skeleton
	feed.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>';

	$.get(backend_url + "User.php?action=photos" + ((id_a) ? '&' + id_a.substring(1) : ''), function (data) {
		if (_activeProfileTab !== 'photos') return;

		if (data.success == 2 || data.success == 3) {
			if (data.success == 2) feed.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-image fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>No photos to show yet.</p></div>';
			return;
		}

		var h = '<div class="profile-media-grid">';
		var count = Object.keys(data).length - 1;
		for (let i = 0; i < count; i++) {
			var m = data[i];
			var isVideo = (m.media_format.indexOf('video') !== -1);
			var mUrl = (isVideo ? video_cdn : media_cdn) + "&id=" + m.media_id + "&h=" + m.media_hash;

			var spoilerClass = (m.is_spoiler == 1) ? ' is-spoiler' : '';
			h += '<div class="media-grid-item' + spoilerClass + '" onclick="_openPostMediaLightbox(' + m.post_id + ')">';
			if (isVideo) {
				h += '<video src="' + mUrl + '"></video>';
				h += '<div class="media-type-icon"><i class="fa-solid fa-play"></i></div>';
			} else {
				h += '<img src="' + mUrl + '">';
			}
			if (m.media_count > 1) {
				h += '<div class="media-count-badge"><i class="fa-solid fa-clone"></i> ' + m.media_count + '</div>';
			}
			h += '</div>';
		}
		h += '</div>';
		feed.innerHTML = h;
	});
}

// --- Group Management Functions ---
var _currentGroupData = null;
var _activeGroupTab = 'timeline';

function fetch_group() {
	var id = get("id");
	var id_a = '';
	if (typeof (id) != 'undefined') id_a = '&id=' + id;

	$.get(backend_url + 'Group.php?action=info' + id_a, function (data) {
		if (data['success'] != 1) {
			gebi('feed').innerHTML = '<div class="empty-state" style="padding:40px; text-align:center;"><p>' + (data.message || 'Group not found') + '</p></div>';
			return;
		}

		_currentGroupData = data;
		var mount = gebi("group-header-mount");
		if (mount) mount.innerHTML = _render_group_header(data);

		// If a specific tab is active, we don't force 'timeline' unless it's the first load or invalid
		var u = new URL(window.location.href);
		if (!_activeGroupTab) _activeGroupTab = 'timeline';
		switchGroupTab(_activeGroupTab, id_a);
	});
}

function _render_group_header(d) {
	var coverUrl = d.cover_media_hash ? media_cdn + "&id=" + d.cover_media_id + "&h=" + d.cover_media_hash : "data/images/default_cover.png";
	var pfpUrl = d.pfp_media_hash ? media_cdn + "&id=" + d.pfp_media_id + "&h=" + d.pfp_media_hash : "data/images/default_group.png";

	var h = '<div class="profile-card group-card premium-card">';

	// Cover
	h += '<div class="profile-cover-container">';
	h += '  <img src="' + coverUrl + '" class="profile-cover-img" id="group-cover">';
	if (d.my_role >= 1) {
		h += '  <div class="profile-cover-edit-btn" onclick="_change_picture(1, ' + d.group_id + ')"><i class="fa-solid fa-camera"></i> Edit Cover</div>';
	}
	h += '</div>';

	// Header Top Area (PFP & Actions)
	h += '<div class="profile-header-top">';
	h += '  <div class="profile-pfp-wrapper" style="position:relative;">';
	h += '    <img src="' + pfpUrl + '" class="profile-pfp" id="group-pfp">';
	if (d.my_role >= 1) {
		h += '    <div class="profile-pfp-edit-btn" onclick="_change_picture(0, ' + d.group_id + ')"><i class="fa-solid fa-camera"></i></div>';
	}
	h += '  </div>';

	h += '  <div class="profile-actions-bar">';
	if (d.my_status == 1) {
		if (d.my_role >= 1) {
			h += '    <button class="btn-primary" onclick="_open_group_settings()"><i class="fa-solid fa-gear"></i> Manage</button>';
		}
		h += '    <button class="btn-secondary-outline" onclick="_group_membership(' + d.group_id + ', \'leave\')"><i class="fa-solid fa-right-from-bracket"></i> Leave</button>';
	} else {
		var joinText = (d.group_privacy == 2) ? 'Join Community' : 'Request to Join';
		h += '    <button class="btn-primary" onclick="_group_membership(' + d.group_id + ', \'join\')"><i class="fa-solid fa-plus"></i> ' + joinText + '</button>';
	}
	h += '  </div>';
	h += '</div>';

	// Name & Metadata Section
	h += '<div class="profile-info-section">';
	h += '  <div class="profile-names">';
	h += '    <h1 class="profile-fullname">' + d.group_name;
	if (d.verified > 0) h += ' ' + getVerifiedBadge(d.verified, "font-size:0.8em; margin-left:8px;", "Verified Community");
	h += '</h1>';

	// Privacy & Meta Badges
	var privIcon = (d.group_privacy == 2) ? 'fa-globe' : (d.group_privacy == 1 ? 'fa-lock' : 'fa-eye-slash');
	var privText = (d.group_privacy == 2) ? 'Public' : (d.group_privacy == 1 ? 'Private' : 'Secret');
	var privColor = (d.group_privacy == 2) ? '#28a745' : '#ffc107';

	h += '    <div class="profile-bio-meta" style="margin-top:5px;">';
	h += '      <span style="color:' + privColor + '"><i class="fa-solid ' + privIcon + '"></i> ' + privText + ' Community</span>';
	h += '      <span><i class="fa-solid fa-users"></i> ' + d.member_count + ' Members</span>';
	h += '    </div>';
	h += '  </div>';

	// About Snippet (Optional)
	if (d.group_about) {
		h += '  <div class="profile-bio-text" style="max-width:600px; margin:15px 0;">' + d.group_about + '</div>';
	}

	// Stats Row (Alternative look)
	h += '  <div class="profile-stat-row" style="border-top: 1px solid var(--color-border); padding-top: 15px;">';
	h += '    <div class="profile-stat-item">';
	h += '      <span class="profile-stat-value">' + round_number(d.member_count) + '</span>';
	h += '      <span class="profile-stat-label">Total Members</span>';
	h += '    </div>';
	h += '  </div>';

	h += '</div>'; // End Info Section

	// Navigation Tabs
	h += '<div class="profile-nav-tabs">';
	h += '  <div class="profile-tab-item active" onclick="switchGroupTab(\'timeline\', \'?id=' + d.group_id + '\', this)">Timeline</div>';
	h += '  <div class="profile-tab-item" onclick="switchGroupTab(\'photos\', \'?id=' + d.group_id + '\', this)">Photos</div>';
	h += '  <div class="profile-tab-item" onclick="switchGroupTab(\'about\', \'?id=' + d.group_id + '\', this)">About</div>';
	h += '  <div class="profile-tab-item" onclick="switchGroupTab(\'members\', \'?id=' + d.group_id + '\', this)">Members</div>';
	h += '</div>';

	h += '</div>'; // End Card
	return h;
}

function switchGroupTab(tabName, id_a, tabElement) {
	_activeGroupTab = tabName;
	if (tabElement) {
		var tabs = tabElement.parentNode.querySelectorAll('.profile-tab-item');
		tabs.forEach(t => t.classList.remove('active'));
		tabElement.classList.add('active');
	}

	var feed = gebi('feed');
	if (!feed) return;
	feed.innerHTML = '';

	// Reset page counter for the new tab
	var pageInput = gebi('page');
	if (pageInput) pageInput.value = 0;

	if (tabName === 'timeline') {
		var d = _currentGroupData;
		// Add Create Post box if member
		if (d.my_status == 1) {
			var pfpUrl = lsg('pfp_media_id') > 0 ? pfp_cdn + '&id=' + lsg('pfp_media_id') + "&h=" + lsg('pfp_media_hash') : getDefaultUserImage(lsg('user_gender'));
			var h = '<div class="createpost_box" style="margin-bottom:20px;">';
			h += '  <img class="pfp" src="' + pfpUrl + '">';
			h += '  <div class="input_box" onclick="make_post(' + d.group_id + ')">Write something to this group...</div>';
			h += '</div>';
			feed.innerHTML = h;
		} else if (d.group_privacy < 2) {
			feed.innerHTML = '<div class="post"><div style="padding:40px; text-align:center; color:var(--color-text-secondary);"><i class="fa-solid fa-lock fa-2x" style="margin-bottom:15px; display:block; opacity:0.5;"></i> This is a private group. Join to see the community posts.</div></div>';
			return;
		}

		// Group Feed
		fetch_post("post.php?scope=group" + id_a.replace('?', '&'), false); // false = append/don't reset feed as we just added create box manually
	} else if (tabName === 'about') {
		var d = _currentGroupData;
		var h = '<div class="profile-about-container">';

		// About Section
		h += '  <div class="about-card">';
		h += '    <div class="about-card-title"><i class="fa-solid fa-circle-info"></i> About Community</div>';
		h += '    <div class="about-bio-text">' + (d.group_about || 'No description provided.') + '</div>';
		h += '  </div>';

		// Metadata Grid
		h += '  <div class="about-card">';
		h += '    <div class="about-card-title"><i class="fa-solid fa-database"></i> Community Information</div>';
		h += '    <div class="about-info-grid">';

		var privText = (d.group_privacy == 2) ? 'Public' : (d.group_privacy == 1 ? 'Closed' : 'Secret');
		var privIcon = (d.group_privacy == 2) ? 'fa-globe' : 'fa-lock';

		h += _render_about_item(privIcon, 'Privacy', privText);
		h += _render_about_item('fa-calendar-days', 'Created', timeSince(d.created_time * 1000) + ' ago');
		h += _render_about_item('fa-users', 'Member Count', d.member_count + ' active members');

		// Rules Section
		if (d.group_rules) {
			h += '    </div>'; // Close previous grid
			h += '  </div>'; // Close previous card
			h += '  <div class="about-card">';
			h += '    <div class="about-card-title"><i class="fa-solid fa-scale-balanced"></i> Community Rules</div>';
			h += '    <div class="about-bio-text" style="white-space: pre-wrap;">' + d.group_rules + '</div>';
		}

		h += '    </div>';
		h += '  </div>';

		h += '</div>';
		feed.innerHTML = h;
	} else if (tabName === 'photos') {
		_load_group_photos(id_a);
	} else if (tabName === 'members') {
		_load_group_members(id_a);
	}
}

function _load_group_photos(id_a) {
	var feed = gebi('feed');
	if (!feed) return;
	feed.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>';

	$.get(backend_url + 'Group.php?action=photos' + ((id_a) ? '&' + id_a.substring(1) : ''), function (data) {
		if (_activeGroupTab !== 'photos') return;

		if (data.success == 2 || data.success == 3) {
			if (data.success == 2) feed.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-image fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>No community photos yet.</p></div>';
			return;
		}

		var h = '<div class="profile-media-grid">';
		var count = Object.keys(data).length - 1;
		for (let i = 0; i < count; i++) {
			var m = data[i];
			var isVideo = (m.media_format.indexOf('video') !== -1);
			var mUrl = (isVideo ? video_cdn : media_cdn) + "&id=" + m.media_id + "&h=" + m.media_hash;

			var spoilerClass = (m.is_spoiler == 1) ? ' is-spoiler' : '';
			h += '<div class="media-grid-item' + spoilerClass + '" onclick="_openPostMediaLightbox(' + m.post_id + ')">';
			if (isVideo) {
				h += '<video src="' + mUrl + '"></video>';
				h += '<div class="media-type-icon"><i class="fa-solid fa-play"></i></div>';
			} else {
				h += '<img src="' + mUrl + '">';
			}
			if (m.media_count > 1) {
				h += '<div class="media-count-badge"><i class="fa-solid fa-clone"></i> ' + m.media_count + '</div>';
			}
			h += '</div>';
		}
		h += '</div>';
		feed.innerHTML = h;
	});
}

function _load_group_members(id_a, query = '') {
	var feed = gebi('feed');
	if (!feed) return;

	var mount = gebi('group-member-mount');
	if (!mount) {
		feed.innerHTML = `
			<div class="member-search-container" style="padding: 20px; border-bottom: 1px solid var(--color-border); margin-bottom: 10px;">
				<div class="search-input-wrapper" style="position: relative;">
					<i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--color-text-dim);"></i>
					<input type="text" id="group-member-search-input" class="premium-input-sm" placeholder="Search members..." style="padding-left: 40px; width: 100%; box-sizing: border-box;" 
						onkeyup="_debounce_group_member_search('${id_a}')">
				</div>
			</div>
			<div id="group-member-mount"></div>
		`;
		mount = gebi('group-member-mount');
	}

	mount.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>';

	var url = backend_url + 'Group.php?action=members' + ((id_a) ? '&' + id_a.substring(1) : '');
	if (query !== '') url += "&query=" + encodeURIComponent(query);

	$.get(url, function (data) {
		if (_activeGroupTab !== 'members') return;

		if (data.length === 0) {
			mount.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-user-group fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>' + (query === '' ? 'This group has no members yet.' : 'No members found matching your search.') + '</p></div>';
			return;
		}

		var h = '<div class="profile-friend-grid">';
		var myRole = _currentGroupData.my_role;
		data.forEach(function (m) {
			var pUrl = m.pfp_media_hash ? media_cdn + "&id=" + m.pfp_media_id + "&h=" + m.pfp_media_hash : "data/images/U.png";
			var roleLabel = (m.role == 2) ? 'Admin' : (m.role == 1 ? 'Moderator' : 'Member');
			var roleClass = (m.role >= 1) ? 'style="color:var(--color-primary); font-weight:bold;"' : '';

			h += '<div class="friend-card group-member-card">';
			h += '  <a href="profile.php?id=' + m.user_id + '" onclick="route(event, this)" style="text-decoration:none; color:inherit; display:block; text-align:center;">';
			h += '    <img src="' + pUrl + '" class="friend-card-pfp">';
			h += '    <div class="friend-card-name">' + m.user_firstname + ' ' + m.user_lastname + getVerifiedBadge(m.verified, "font-size:0.8em;") + '</div>';
			h += '    <div class="friend-card-username" ' + roleClass + '>' + roleLabel + '</div>';
			if (m.joined_time) {
				h += '    <div class="friend-card-meta" style="font-size:0.75rem; color:var(--color-text-dim); margin-top:4px;">Joined ' + timeSince(m.joined_time * 1000) + ' ago</div>';
			}
			h += '  </a>';

			// Management buttons
			if (m.user_id != lsg('user_id')) {
				h += '<div class="member-management-actions" style="margin-top:10px; display:flex; gap:5px; justify-content:center; flex-wrap:wrap;">';
				// Kick
				if (myRole == 2 || (myRole == 1 && m.role == 0)) {
					h += '<button class="btn-danger-outline btn-xs" onclick="_group_admin_action(' + _currentGroupData.group_id + ', ' + m.user_id + ', \'kick\')" title="Kick Member"><i class="fa-solid fa-user-xmark"></i></button>';
				}
				// Promote/Demote (Only Admin)
				if (myRole == 2) {
					if (m.role == 0) {
						h += '<button class="btn-primary-outline btn-xs" onclick="_group_admin_action(' + _currentGroupData.group_id + ', ' + m.user_id + ', \'promote\')" title="Promote to Moderator"><i class="fa-solid fa-user-shield"></i></button>';
					} else if (m.role == 1) {
						h += '<button class="btn-warning-outline btn-xs" onclick="_group_admin_action(' + _currentGroupData.group_id + ', ' + m.user_id + ', \'demote\')" title="Demote to Member"><i class="fa-solid fa-user-minus"></i></button>';
					}
				}
				h += '</div>';
			}

			h += '</div>';
		});
		h += '</div>';
		mount.innerHTML = h;
	});
}

var _gmSearchTimeout = null;
function _debounce_group_member_search(id_a) {
	clearTimeout(_gmSearchTimeout);
	_gmSearchTimeout = setTimeout(function () {
		var q = gebi('group-member-search-input').value;
		_load_group_members(id_a, q);
	}, 500);
}


function _group_admin_action(groupId, targetUserId, action) {
	var actionLabel = (action === 'kick') ? 'kick this member' : (action === 'promote' ? 'promote this member to Moderator' : 'demote this moderator to Member');
	_confirm_modal("Are you sure you want to " + actionLabel + "?", function () {
		$.post(backend_url + 'Group.php', { group_id: groupId, target_user_id: targetUserId, action: action }, function (data) {
			if (data.success == 1) {
				var id_a = '?id=' + groupId;
				_load_group_members(id_a);
				_alert_modal(data.message);
			} else {
				_alert_modal(data.message);
			}
		});
	});
}

// Redefine _confirm_modal slightly to accept functions or strings
function _confirm_modal(msg, callback) {
	var content = gebi("modal_content");
	var h = '';
	h += '<div class="upload-modal-container" style="max-width:400px; text-align:center;">';
	h += '<div class="upload-modal-header" style="justify-content:center;"><h2>Confirm</h2></div>';
	h += '<div class="upload-modal-body" style="padding:20px;">' + msg + '</div>';
	h += '<div class="upload-modal-footer" style="justify-content:center; gap: 10px;">';
	h += '<button class="btn-secondary-outline" onclick="modal_close()">Cancel</button>';

	// Create a unique callback name if it's a function
	var callbackStr = '';
	if (typeof callback === 'function') {
		var cbName = 'cb_' + Math.floor(Math.random() * 1000000);
		window[cbName] = function () {
			callback();
			delete window[cbName];
		};
		callbackStr = 'window.' + cbName + '()';
	} else {
		callbackStr = callback;
	}

	h += '<button class="btn-primary" onclick="modal_close(); ' + callbackStr + '">Confirm</button>';
	h += '</div></div>';
	content.innerHTML = h;
	gebi("modal").style.display = "flex";
}

function _group_membership(groupId, action) {
	if (action === 'join' && _currentGroupData && _currentGroupData.group_rules) {
		// Show rules modal
		modal_open('group_rules');
		var content = gebi("modal_content");
		var h = '';
		h += '<div class="upload-modal-container">';
		h += '<div class="upload-modal-header"><h2>Community Rules</h2><i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i></div>';
		h += '<div class="upload-modal-body" style="padding:20px;">';
		h += '<p style="margin-bottom:15px; color:var(--color-text-secondary);">Please read and agree to the rules before joining this group.</p>';
		h += '<div class="rules-container" style="background:var(--color-background-secondary); padding:15px; border-radius:8px; max-height:300px; overflow-y:auto; margin-bottom:20px; white-space: pre-wrap; font-size:0.95rem;">';
		h += _currentGroupData.group_rules;
		h += '</div>';
		h += '<label class="checkbox-container" style="display:flex; align-items:center; gap:10px; cursor:pointer;">';
		h += '<input type="checkbox" id="agree_rules_check" onchange="gebi(\'join_btn_rules\').disabled = !this.checked">';
		h += '<span>I agree to these rules</span>';
		h += '</label>';
		h += '</div>';
		h += '<div class="upload-modal-footer">';
		h += '<button id="join_btn_rules" class="btn-primary" disabled onclick="_confirm_join_group(' + groupId + ')">Join Group</button>';
		h += '</div>';
		h += '</div>';
		content.innerHTML = h;
		return;
	}

	_confirm_join_group(groupId, action);
}

function _confirm_join_group(groupId, action = 'join') {
	if (action === 'join' && gebi('agree_rules_check')) {
		// If coming from rules modal
		modal_close();
	}

	$.post(backend_url + 'Group.php', { id: groupId, action: action }, function (data) {
		if (data.success == 1) {
			fetch_group(); // Refresh header
		} else {
			_alert_modal(data.message);
		}
	});
}

function _open_group_settings() {
	var d = _currentGroupData;
	var groupId = d.group_id;
	modal_open('group_settings_edit', groupId);
	var content = gebi("modal_content");
	var h = '';
	h += '<div class="upload-modal-container" style="max-width:600px;">';
	h += '<div class="upload-modal-header"><h2>Manage Group</h2><i class="fa-solid fa-xmark close-modal-btn" onclick="modal_close()"></i></div>';
	h += '<div class="upload-modal-body" style="padding:20px;">';

	h += '<div class="input-group" style="margin-bottom:15px;">';
	h += '<label class="input-label">Group Name</label>';
	h += '<input type="text" id="edit_group_name" class="index_input_box" value="' + d.group_name + '">';
	h += '</div>';

	h += '<div class="input-group" style="margin-bottom:15px;">';
	h += '<label class="input-label">About</label>';
	h += '<textarea id="edit_group_about" class="index_input_box" style="height:100px;">' + (d.group_about || '') + '</textarea>';
	h += '</div>';

	h += '<div class="input-group" style="margin-bottom:15px;">';
	h += '<label class="input-label">Privacy</label>';
	h += '<select id="edit_group_privacy" class="index_input_box" style="width:100%;">';
	h += '<option value="2" ' + (d.group_privacy == 2 ? 'selected' : '') + '>Public - visible to everyone</option>';
	h += '<option value="1" ' + (d.group_privacy == 1 ? 'selected' : '') + '>Closed - only members can see posts</option>';
	h += '<option value="0" ' + (d.group_privacy == 0 ? 'selected' : '') + '>Secret - hidden from search</option>';
	h += '</select>';
	h += '</div>';

	h += '<div class="input-group" style="margin-bottom:15px;">';
	h += '<label class="input-label">Community Rules</label>';
	h += '<textarea id="edit_group_rules" class="index_input_box" style="height:150px;" placeholder="Set rules for your community...">' + (d.group_rules || '') + '</textarea>';
	h += '</div>';

	h += '<div class="input-group" style="margin-bottom:15px; border-top: 1px solid var(--color-border); padding-top: 15px;">';
	h += '<h3 style="color:var(--color-danger); margin-bottom:10px;">Danger Zone</h3>';
	h += '<p style="color:var(--color-text-secondary); margin-bottom:10px; font-size:0.9rem;">Once you delete a group, there is no going back. Please be certain.</p>';
	h += '<button class="btn-danger-outline" onclick="_delete_group_modal(' + groupId + ')">Delete this group</button>';
	h += '</div>';

	h += '</div>';
	h += '<div class="upload-modal-footer">';
	h += '<button class="btn-primary" onclick="_submit_group_settings(' + groupId + ')">Save Changes</button>';
	h += '</div>';
	h += '</div>';
	content.innerHTML = h;
}

function _delete_group_modal(groupId) {
	var content = gebi("modal_content");
	var h = '';
	h += '<div class="upload-modal-container" style="max-width:450px;">';
	h += '<div class="upload-modal-header" style="justify-content:center;"><h2>Delete Group?</h2></div>';
	h += '<div class="upload-modal-body" style="padding:20px; text-align:center;">';
	h += '<p style="margin-bottom:20px; color:var(--color-text-secondary);">This action cannot be undone. All posts and member data will be removed.</p>';

	h += '<div class="input-group" style="margin-bottom:15px; text-align:left;">';
	h += '<label class="input-label">Enter Password</label>';
	h += '<input type="password" id="del_group_password" class="index_input_box" placeholder="Your password">';
	h += '</div>';

	h += '<div id="del_group_2fa_container" style="display:none; text-align:left; margin-bottom:15px;">';
	h += '<label class="input-label">2FA Code</label>';
	h += '<input type="text" id="del_group_2fa_code" class="index_input_box" placeholder="Enter 6-digit code">';
	h += '</div>';

	h += '</div>';
	h += '<div class="upload-modal-footer" style="justify-content:center;">';
	h += '<button class="btn-secondary-outline" onclick="modal_close()">Cancel</button>';
	h += '<button class="btn-danger" id="btn_confirm_del_group" onclick="_delete_group(' + groupId + ')">Confirm Delete</button>';
	h += '</div></div>';

	content.innerHTML = h;
	// Do not use modal_open here, because we might be switching from another modal. 
	// We are replacing content. But if called from button, the modal is already open (Settings).
	// Actually we should probably just replace content.
	// But `modal_open` sets display:flex.
	gebi("modal").style.display = "flex";
}

function _delete_group(groupId) {
	var pass = gebi('del_group_password').value;
	var code = gebi('del_group_2fa_code').value;

	if (pass === '') {
		alert("Password is required.");
		return;
	}

	var btn = gebi('btn_confirm_del_group');
	btn.disabled = true;
	btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

	$.post(backend_url + 'Group.php?action=delete', { id: groupId, password: encryptPassword(pass), code: code }, function (data) {
		btn.disabled = false;
		btn.innerHTML = 'Confirm Delete';

		if (data.success == 1) {
			window.location.href = "home.php";
		} else {
			if (data.err === '2fa_required') {
				gebi('del_group_2fa_container').style.display = 'block';
				alert("2FA Verification Required. Please enter your code.");
				gebi('del_group_2fa_code').focus();
			} else {
				alert("Error: " + data.err);
			}
		}
	});
}

function _submit_group_settings(groupId) {
	var name = gebi('edit_group_name').value;
	var about = gebi('edit_group_about').value;
	var privacy = gebi('edit_group_privacy').value;
	var rules = gebi('edit_group_rules').value;

	$.post(backend_url + 'Group.php?action=update', {
		id: groupId,
		name: name,
		about: about,
		privacy: privacy,
		rules: rules
	}, function (r) {
		if (r.success === 1) {
			modal_close();
			fetch_group(); // Refresh to show new info
		} else {
			_alert_modal(r.message || "Failed to update group.");
		}
	});
}

function _create_group() {
	var name = gebi('group_create_name').value;
	var about = gebi('group_create_about').value;
	var privacy = gebi('group_create_privacy').value;

	if (!name) {
		alert("Please enter a group name");
		return;
	}

	$.post(backend_url + 'Group.php?action=create', { name: name, about: about, privacy: privacy }, function (data) {
		if (data.success == 1) {
			modal_close();
			window.location.href = 'group.php?id=' + data.group_id;
		} else {
			alert(data.message);
		}
	});
}

function _load_groups_discovery() {
	var mount = gebi('groups-discovery-mount');
	if (!mount) return;

	$.get(backend_url + 'Group.php?action=list', function (data) {
		if (data.length === 0) {
			mount.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-users fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>No communities found. Why not create one?</p></div>';
			return;
		}

		var h = '<div class="groups-discovery-grid">';
		data.forEach(function (g) {
			var coverUrl = g.cover_media_hash ? media_cdn + "&id=" + g.cover_media_id + "&h=" + g.cover_media_hash : "data/images/default_cover.png";
			var pfpUrl = g.pfp_media_hash ? media_cdn + "&id=" + g.pfp_media_id + "&h=" + g.pfp_media_hash : "data/images/default_group.png";

			h += '<a href="group.php?id=' + g.group_id + '" class="group-discovery-card premium-hover-card" onclick="route(event, this)">';
			h += '  <div class="group-discovery-cover" style="background-image: url(' + coverUrl + ');">';

			// Membership Status Badge
			if (g.my_status == 1) {
				h += '    <div class="group-status-badge joined"><i class="fa-solid fa-check-circle"></i> Joined</div>';
			} else if (g.my_status == 0) {
				h += '    <div class="group-status-badge pending"><i class="fa-regular fa-clock"></i> Pending</div>';
			}

			h += '  </div>';
			h += '  <div class="group-discovery-info">';
			h += '    <img src="' + pfpUrl + '" class="group-discovery-pfp">';
			h += '    <div class="group-discovery-name">' + g.group_name;
			if (g.verified > 0) h += getVerifiedBadge(g.verified, "margin-left:5px;", "Verified Community");
			h += '</div>';
			h += '    <div class="group-discovery-about">' + (g.group_about || 'No description.') + '</div>';
			h += '    <div class="group-discovery-meta">';
			h += '      <span class="meta-item"><i class="fa-solid fa-user-group"></i> ' + g.member_count + ' Members</span>';

			var privIcon = (g.group_privacy == 2) ? 'fa-globe' : 'fa-lock';
			var privText = (g.group_privacy == 2) ? 'Public' : 'Private';
			h += '      <span class="meta-item"><i class="fa-solid ' + privIcon + '"></i> ' + privText + '</span>';

			h += '    </div>';
			h += '  </div>';
			h += '</a>';
		});
		h += '</div>';
		mount.innerHTML = h;
	});
}

function _openPostMediaLightbox(postId) {
	var feed = gebi('feed');
	// Initial skeleton
	feed.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>';

	$.get(backend_url + "User.php?action=photos" + ((id_a) ? '&' + id_a.substring(1) : ''), function (data) {
		if (data.success === 1 || data.success === 3) {

			var keys = Object.keys(data).filter(k => !isNaN(k));

			if (keys.length === 0) {
				feed.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-images fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>No photos yet.</p></div>';
				return;
			}

			// Store data for lightbox navigation
			_photoLightboxData = keys.map(k => data[k]);

			var html = '<div class="profile-media-grid">';
			keys.forEach(function (key, index) {
				var m = data[key];
				var cdn = m.is_video ? video_cdn : media_cdn;
				var src = cdn + '&id=' + m.media_id + '&h=' + m.media_hash;

				html += '<div class="media-grid-item" onclick="_openPostMediaLightbox(' + m.post_id + ')">';

				if (m.is_video) {
					html += '<video src="' + src + '#t=0.5" preload="metadata" muted></video>';
					html += '<div class="media-type-icon"><i class="fa-solid fa-play"></i></div>';
				} else {
					html += '<img src="' + src + '" loading="lazy">';
				}

				// Show count badge if multiple media in post
				if (m.media_count > 1) {
					html += '<div class="media-count-badge"><i class="fa-solid fa-images"></i> ' + m.media_count + '</div>';
				}

				html += '</div>';
			});
			html += '</div>';
			feed.innerHTML = html;
		} else {
			feed.innerHTML = '<div style="padding:20px; text-align:center; color:var(--color-text-dim);">Failed to load photos.</div>';
		}
	});
}

// Opens lightbox with all media from a specific post
function _openPostMediaLightbox(postId) {
	_photoLightboxPostId = postId;
	_photoLightboxIndex = 0;

	// Create lightbox element if it doesn't exist
	var lightbox = gebi('photo-lightbox');
	if (!lightbox) {
		lightbox = document.createElement('div');
		lightbox.id = 'photo-lightbox';
		lightbox.className = 'photo-lightbox';
		lightbox.innerHTML = `
			<div class="lightbox-close" onclick="_closePhotoLightbox()"><i class="fa-solid fa-xmark"></i></div>
			<div class="lightbox-counter" id="lightbox-counter"></div>
			<div class="lightbox-nav prev" onclick="_navigateLightbox(-1)"><i class="fa-solid fa-chevron-left"></i></div>
			<div class="lightbox-content" id="lightbox-content"><div style="color:white;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div></div>
			<div class="lightbox-nav next" onclick="_navigateLightbox(1)"><i class="fa-solid fa-chevron-right"></i></div>
			<div class="lightbox-actions">
				<button onclick="_goToPostFromLightbox()"><i class="fa-solid fa-arrow-up-right-from-square"></i> View Post</button>
			</div>
		`;
		document.body.appendChild(lightbox);

		// Click outside to close
		lightbox.addEventListener('click', function (e) {
			if (e.target === lightbox) _closePhotoLightbox();
		});
	}

	// Show lightbox with loading state
	gebi('lightbox-content').innerHTML = '<div style="color:white;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>';
	gebi('lightbox-counter').textContent = '';
	lightbox.classList.add('active');
	document.body.style.overflow = 'hidden';
	document.addEventListener('keydown', _lightboxKeyHandler);

	// Fetch all media for this post
	$.get(backend_url + "post.php?scope=media&id=" + postId, function (data) {
		if (data.success === 1 && data.media && data.media.length > 0) {
			_photoLightboxData = data.media.map(function (m) {
				return {
					media_id: m.media_id,
					media_hash: m.media_hash,
					media_format: m.media_format,
					is_video: m.media_format.startsWith('video'),
					post_id: postId
				};
			});
			_updateLightboxContent();
		} else {
			gebi('lightbox-content').innerHTML = '<div style="color:white;">No media found</div>';
		}
	});
}

function _updateLightboxContent() {
	var m = _photoLightboxData[_photoLightboxIndex];
	if (!m) return;

	var cdn = m.is_video ? video_cdn : media_cdn;
	var src = cdn + '&id=' + m.media_id + '&h=' + m.media_hash;
	var content = gebi('lightbox-content');
	var counter = gebi('lightbox-counter');

	if (m.is_video) {
		// Use custom video player
		content.innerHTML = '<div class="custom-video-container lightbox-video"><video src="' + src + '" preload="metadata"></video></div>';
		// Initialize the custom video player
		var videoContainer = content.querySelector('.custom-video-container');
		if (videoContainer && typeof initVideoPlayer === 'function') {
			initVideoPlayer(videoContainer);
		}
	} else {
		content.innerHTML = '<img src="' + src + '">';
	}

	counter.textContent = (_photoLightboxIndex + 1) + ' / ' + _photoLightboxData.length;

	// Update nav visibility
	var prevNav = document.querySelector('.lightbox-nav.prev');
	var nextNav = document.querySelector('.lightbox-nav.next');
	if (prevNav) prevNav.style.opacity = _photoLightboxIndex > 0 ? '' : '0.3';
	if (nextNav) nextNav.style.opacity = _photoLightboxIndex < _photoLightboxData.length - 1 ? '' : '0.3';
}

function _navigateLightbox(direction) {
	var newIndex = _photoLightboxIndex + direction;
	if (newIndex >= 0 && newIndex < _photoLightboxData.length) {
		_photoLightboxIndex = newIndex;
		_updateLightboxContent();
	}
}

function _closePhotoLightbox() {
	var lightbox = gebi('photo-lightbox');
	if (lightbox) {
		lightbox.classList.remove('active');
		// Stop any playing video
		var video = lightbox.querySelector('video');
		if (video) video.pause();
	}
	document.body.style.overflow = '';
	document.removeEventListener('keydown', _lightboxKeyHandler);
}

function _goToPostFromLightbox() {
	if (_photoLightboxPostId) {
		_closePhotoLightbox();
		modal_open('view_post', _photoLightboxPostId);
	}
}

function _lightboxKeyHandler(e) {
	switch (e.key) {
		case 'Escape':
			_closePhotoLightbox();
			break;
		case 'ArrowLeft':
			_navigateLightbox(-1);
			break;
		case 'ArrowRight':
			_navigateLightbox(1);
			break;
	}
}


function _load_profile_friends(id_a) {
	var feed = gebi('feed');
	// Initial skeleton or loading state
	feed.innerHTML = '<div style="padding:40px; text-align:center;"><i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color:var(--color-primary)"></i></div>';

	$.get(backend_url + "User.php?action=friends" + ((id_a) ? '&' + id_a.substring(1) : ''), function (data) {
		if (data.success === 1 || data.success === 3) {

			// Check if list is empty (object keys length check minus success key)
			// The PHP returns numeric keys 0..N and 'success'.
			var keys = Object.keys(data).filter(k => !isNaN(k));

			if (keys.length === 0) {
				feed.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--color-text-dim);"><i class="fa-solid fa-user-group fa-3x" style="margin-bottom:15px; display:block; opacity:0.5;"></i><p>No friends to show yet.</p></div>';
				return;
			}

			var html = '<div class="profile-friend-grid">';
			keys.forEach(function (key) {
				var u = data[key];
				// PFP Logic
				var pfp = (u['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + u['pfp_media_id'] + "&h=" + u['pfp_media_hash'] : getDefaultUserImage(u['user_gender']);

				html += '<a href="profile.php?id=' + u['user_id'] + '" class="friend-card">';
				html += '<img class="friend-card-pfp" src="' + pfp + '">';
				html += '<div class="friend-card-name">';
				html += u['user_firstname'] + ' ' + u['user_lastname'];
				if (u['verified'] > 0)
					html += ' ' + getVerifiedBadge(u['verified'], "font-size:0.9em;");
				html += '</div>';
				html += '<div class="friend-card-username">@' + u['user_nickname'] + '</div>';
				html += '</a>';
			});
			html += '</div>';
			feed.innerHTML = html;
		} else {
			feed.innerHTML = '<div style="padding:20px; text-align:center; color:var(--color-text-dim);">Failed to load friends.</div>';
		}
	});
}
function _load_post(post_id = null) {
	id = (post_id != null) ? post_id : get('id');
	$.get(backend_url + "Post.php?scope=single&id=" + id, function (data) {
		if (data['success'] == 2) return;

		_content_left = gebi("_content_left");
		_content_right = gebi("_content_right");

		// Reset containers if they exist (for direct post.php view)
		if (_content_left) _content_left.innerHTML = '';
		if (_content_right) _content_right.innerHTML = '';

		// Construct the new premium layout
		var isModal = gebi('modal').style.display === 'flex';
		var containerHtml = '<div class="post-view-modal">';

		// LEFT COLUMN (Media)
		containerHtml += '<div class="post-view-left" id="post-view-left-content">';
		if (isModal) {
			containerHtml += '<div class="post-view-close" onclick="modal_close()"><i class="fa-solid fa-xmark"></i></div>';
		}
		containerHtml += '</div>';

		// RIGHT COLUMN (Info, Caption, Comments)
		containerHtml += '<div class="post-view-right">';

		// Header
		containerHtml += '<div class="post-view-header">';
		var pfpUrl = (data['pfp_media_id'] > 0) ? pfp_cdn + '&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] : getDefaultUserImage(data['user_gender']);
		containerHtml += '  <img class="comment-pfp" src="' + pfpUrl + '">';
		containerHtml += '  <div style="flex:1;">';
		containerHtml += '    <div style="font-weight:700; font-size:1.05rem;"><a class="profilelink" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'] + '</a></div>';
		containerHtml += '    <div style="font-size:0.85rem; color:var(--color-text-dim);">@' + data['user_nickname'] + ' • ' + timeSince(data['post_time'] * 1000) + '</div>';
		containerHtml += '  </div>';

		// Options Menus
		var postUrl = window.location.origin + '/post.php?id=' + data['post_id'];
		containerHtml += '  <div class="post-options-container">';
		containerHtml += '    <div class="post-options-btn" onclick="togglePostOptions(' + data['post_id'] + ')"><i class="fa-solid fa-ellipsis"></i></div>';
		containerHtml += '    <div class="post-options-menu" id="post-options-menu-' + data['post_id'] + '">';
		containerHtml += '      <div class="post-options-item" onclick="copyToClipboard(\'' + postUrl + '\', \'copy-btn-detail-' + data['post_id'] + '\'); togglePostOptions(' + data['post_id'] + ')">';
		containerHtml += '        <i class="fa-regular fa-link"></i><span>' + i18n.t("lang__088") + '</span><span id="copy-btn-detail-' + data['post_id'] + '" style="display:none"></span>';
		containerHtml += '      </div>';
		if (data['is_mine'] == 1) {
			containerHtml += '      <div class="post-options-item" onclick="_open_edit_post(' + data['post_id'] + ')"><i class="fa-regular fa-pen-to-square"></i><span>' + i18n.t("lang__089") + '</span></div>';
			containerHtml += '      <div class="post-options-item" style="color:#ff4d4d;" onclick="_delete_post(' + data['post_id'] + ')"><i class="fa-regular fa-trash-can"></i><span>' + i18n.t("lang__090") + '</span></div>';
		}
		containerHtml += '    </div>';
		containerHtml += '  </div>';
		containerHtml += '</div>';

		// Content (Caption + Interaction + Comments)
		containerHtml += '<div class="post-view-content">';
		if (data['post_caption']) {
			containerHtml += '<div class="post-view-caption">' + data['post_caption'] + '</div>';
		}

		// Interaction Bar
		var liked = (data['is_liked'] == 1) ? 'p-heart fa-solid' : 'white-col fa-regular';
		containerHtml += '<div class="post-detail-interaction-bar">';
		containerHtml += '  <div class="interaction-item" onclick="_like(' + data['post_id'] + ')"><i class="' + liked + ' fa-heart"></i><span>' + round_number(data['total_like']) + '</span></div>';
		containerHtml += '  <div class="interaction-item"><i class="fa-regular fa-comment"></i><span>' + round_number(data['total_comment']) + '</span></div>';
		containerHtml += '  <div class="interaction-item" onclick="modal_open(\'share\', ' + data['post_id'] + ')"><i class="fa-regular fa-share-nodes"></i><span>' + round_number(data['total_share']) + '</span></div>';
		containerHtml += '</div>';


		// Comment Box
		containerHtml += '<div class="comment-box" id="comment-box">';
		containerHtml += '<div id="comment-list"></div>';
		containerHtml += '<div id="load-more-comments-container" style="display:none; text-align:center; padding:10px;">';
		containerHtml += '<button class="load-more-btn" onclick="loadComments(' + data['post_id'] + ', -1, false)">' + i18n.t("lang__091") + '</button>';
		containerHtml += '</div>'; // End load more container
		containerHtml += '</div>';
		containerHtml += '</div>'; // End content

		// Comment Form (Fixed at bottom)
		containerHtml += '<div class="comment-form">';
		containerHtml += '  <div class="comment-form-text" id="comment-text-' + data['post_id'] + '" contenteditable="true" placeholder="' + i18n.t("lang__092") + '"></div>';
		containerHtml += '  <div class="send-btn" onclick="_send_comment(' + data['post_id'] + ')"><i class="fa-solid fa-paper-plane"></i></div>';
		containerHtml += '</div>';

		containerHtml += '</div>'; // End right column
		containerHtml += '</div>'; // End main container

		// Integration for post.php or Modal
		if (isModal) {
			// Modal view
			gebi("modal_content").innerHTML = containerHtml;
			var mc = gebi("post-view-left-content");
			_render_media_into_container(data, mc);
		} else {
			// post.php view
			var mount = gebi('image_content');
			if (mount) {
				mount.innerHTML = containerHtml;
				_content_left = gebi("post-view-left-content");
				// Logic to handle media in left col
				_render_media_into_container(data, _content_left);
			}
		}

		loadComments(data['post_id'], 0, true);
		changeUrlWork();
	});
}

function focusCommentInput(postId) {
	const input = gebi('comment-text-' + postId);
	if (input) {
		input.focus();
		// Place cursor at end if there's already text (though usually empty here)
		const range = document.createRange();
		const sel = window.getSelection();
		range.selectNodeContents(input);
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);
	}
}
function _render_media_into_container(data, container) {
	if (!container) return;
	var mediaList = (data['is_share'] > 0) ?
		(data['share']['post_media_list'] ? data['share']['post_media_list'] : (data['share']['post_media'] != 0 ? data['share']['post_media'] + ":" + data['share']['media_hash'] + ":" + data['share']['media_format'] : null)) :
		(data['post_media_list'] ? data['post_media_list'] : (data['post_media'] != 0 ? data['post_media'] + ":" + data['media_hash'] + ":" + data['media_format'] : null));

	if (mediaList) {
		// Check item count
		var items = [];
		var p = mediaList.split(',');
		p.forEach(function (x) {
			var d = x.split(':');
			if (d.length >= 3) items.push({
				id: d[0],
				hash: d[1],
				format: d[2]
			});
		});

		// Determine Post ID for scoping (kept for IDs but logic will use DOM)
		var postId = data['post_id'];

		if (items.length > 1) {
			// Multi-media: Show View Toggles
			var html = '';
			html += '<div class="post-media-container">';

			// Toggles
			html += '<div class="view-toggle-container">';
			html += '<button class="view-toggle-btn active" onclick="togglePostView(\'carousel\', this)" title="Carousel View"><i class="fa-regular fa-images"></i></button>';
			html += '<button class="view-toggle-btn" onclick="togglePostView(\'grid\', this)" title="Grid View"><i class="fa-regular fa-grid"></i></button>';
			html += '</div>';

			// Carousel View (Default)
			html += '<div class="post-media-carousel-view js-carousel-container">';
			html += renderMedia(mediaList);
			html += '</div>';

			// Grid View
			html += '<div class="post-media-grid-view js-grid-container view-hidden">';
			var itemsJson = JSON.stringify(items).replace(/"/g, '&quot;');
			items.forEach(function (s, idx) {
				let url = s.format.startsWith('video') ?
					video_cdn + '&id=' + s.id + '&h=' + s.hash :
					media_cdn + '&id=' + s.id + '&h=' + s.hash;

				var content = '';
				if (s.format.startsWith('video')) {
					content = '<div class="grid-media-item">';
					content += '<video src="' + url + '" onclick="viewFullImage(' + itemsJson + ', ' + idx + ')"></video>';
					content += '</div>';
				} else {
					content = '<div class="grid-media-item">';
					content += '<img src="' + url + '" onclick="viewFullImage(' + itemsJson + ', ' + idx + ')">';
					content += '</div>';
				}
				html += content;
			});
			html += '</div>'; // End grid view

			html += '</div>'; // End main container

			container.innerHTML = html;
		} else {
			// Single item or empty
			container.innerHTML = renderMedia(mediaList);
		}
	} else {
		container.style.display = 'none';
	}
}


// End of premium detail view logic

function togglePostView(view, btnElement) {
	// Traverse DOM to identify the container
	// Button is inside .view-toggle-container, which is inside .post-media-container
	var toggleContainer = btnElement.parentElement;
	var wrapper = toggleContainer.parentElement;

	if (!wrapper || !wrapper.classList.contains('post-media-container')) return;

	var cv = wrapper.querySelector('.js-carousel-container');
	var gv = wrapper.querySelector('.js-grid-container');
	var btns = toggleContainer.querySelectorAll('.view-toggle-btn');

	if (view === 'carousel') {
		cv.classList.remove('view-hidden');
		gv.classList.add('view-hidden');

		btns.forEach(b => {
			if (b.title === "Carousel View") b.classList.add('active');
			else b.classList.remove('active');
		});
	} else {
		cv.classList.add('view-hidden');
		gv.classList.remove('view-hidden');

		btns.forEach(b => {
			if (b.title === "Grid View") b.classList.add('active');
			else b.classList.remove('active');
		});
	}
}
function _friend_request_toggle(id, accept) {
	ac = '';
	if (accept == 1)
		ac = 'accept';
	else
		ac = 'ignore';
	$.get(backend_url + 'User.php?action=friend_respond&id=' + id + '&' + ac, function (data) {
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
	f.append('action', 'comment');
	f.append('post_id', get("id"));
	f.append('comment', text);
	$.ajax({
		type: "POST",
		url: backend_url + "Post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			$.get(backend_url + "User.php?action=profile", function (data) {
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
					a += getVerifiedBadge(data['verified'], "margin-left:4px; font-size: 11px;");
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
		url: backend_url + 'User.php?action=friend_request&id=' + get("id"),
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
		url: backend_url + 'User.php?action=follow',
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
		url: backend_url + 'User.php?action=online',
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
		url: backend_url + "User.php?action=requests&type=count",
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
	$.get(backend_url + "Notification.php?action=count", function (r) {
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

	$.get(backend_url + "Notification.php", function (r) {
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
	$.get(backend_url + "Notification.php?action=read_all", function (r) {
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



function _load_2fa_status() {
	var statusText = gebi('2fa-status-text');
	var btn = gebi('2fa-btn');
	if (!statusText || !btn) return;

	$.get(backend_url + "Auth.php?action=2fa_status", function (r) {
		if (r.success === 1) {
			var statusParts = [];
			if (r.totp_enabled) statusParts.push('Authenticator');
			if (r.security_keys && r.security_keys.length > 0) {
				statusParts.push(r.security_keys.length + ' Key' + (r.security_keys.length > 1 ? 's' : ''));
			}

			if (statusParts.length > 0) {
				statusText.innerText = statusParts.join(' + ');
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

	$.get(backend_url + 'Auth.php?action=2fa_status', function (r) {
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
			h += '<div><i class="fa-solid fa-key" style="color:var(--color-primary); margin-right:10px;"></i> <strong id="key-name-' + key.id + '">' + key.name + '</strong>';
			h += '<p style="margin:5px 0 0 0; font-size:0.8em; color:var(--color-text-dim);">Added: ' + key.created_at + '</p></div>';
			h += '<div style="display:flex; gap:8px;">';
			h += '<button class="btn-icon" onclick="_rename_security_key(' + key.id + ', \'' + key.name.replace(/'/g, "\\'") + '\')" title="Rename Key"><i class="fa-solid fa-pencil"></i></button>';
			h += '<button class="btn-icon red_alert" onclick="_remove_security_key(' + key.id + ')" title="Remove Key"><i class="fa-solid fa-trash"></i></button>';
			h += '</div>';
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

	fetch(backend_url + 'Auth.php?action=webauthn_remove', {
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

function _rename_security_key(id, currentName) {
	var content = gebi("modal_content");
	var h = '';
	h += '<div class="upload-modal-container" style="max-width:400px;">';
	h += '<div class="upload-modal-header">';
	h += '<h2>Rename Security Key</h2>';
	h += '<i class="fa-solid fa-xmark close-modal-btn" onclick="_manage_2fa()"></i>';
	h += '</div>';
	h += '<div class="upload-modal-body" style="padding:20px;">';
	h += '<label style="display:block; margin-bottom:8px; color:var(--color-text-dim);">New Name</label>';
	h += '<input type="text" id="rename-key-input" class="settings_input" value="' + currentName.replace(/"/g, '&quot;') + '" maxlength="100" style="width:100%; margin-bottom:20px;">';
	h += '<div style="display:flex; gap:10px; justify-content:flex-end;">';
	h += '<button class="setting-btn" onclick="_manage_2fa()">Cancel</button>';
	h += '<button class="setting-btn primary" onclick="_submit_rename_key(' + id + ')">Save</button>';
	h += '</div>';
	h += '</div>';
	h += '</div>';
	content.innerHTML = h;
	gebi("modal").style.display = "flex";
	gebi("rename-key-input").focus();
	gebi("rename-key-input").select();
}

function _submit_rename_key(id) {
	var newName = gebi("rename-key-input").value.trim();
	if (!newName || newName.length < 1) {
		_error_modal('Name cannot be empty');
		return;
	}

	fetch(backend_url + 'Auth.php?action=webauthn_rename', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ credential_id: id, name: newName })
	})
		.then(r => r.json())
		.then(data => {
			if (data.success) {
				_manage_2fa(); // Refresh management modal
				_load_2fa_status(); // Update settings page text
			} else {
				_error_modal('Error: ' + data.error);
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
	fetch(backend_url + 'Auth.php?action=webauthn_register')
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

					return fetch(backend_url + 'Auth.php?action=webauthn_register', {
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
	var tabs = ['account', 'profile', 'appearance', 'about'];
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
	var usergender = (usergender[0].checked ? "M" : (usergender[1].checked ? "F" : (usergender[2].checked ? "U" : "U")));
	var userstatus = gebi("userstatus").value;
	var relationship_user_id = gebi("relationship_user_id").value;
	d = new FormData();
	d.append('type', 'ChangePofileInfomation');
	d.append('userfirstname', userfirstname);
	d.append('userlastname', userlastname);
	d.append('birthday', birthday);
	d.append('userhometown', userhometown);
	d.append('userabout', userabout);
	d.append('usergender', usergender);
	d.append('userstatus', userstatus);
	d.append('relationship_user_id', relationship_user_id);
	$.ajax(backend_url + 'Account.php', {
		method: "POST",
		data: d,
		processData: false,
		contentType: false,
		success: function (q) {
			if (q['success'] != 1) {
				a = '';
				switch (q['code']) {
					case 0:
						a = i18n.t("lang__046");
						break;
					case 1:
						a = i18n.t("lang__78");
						break;
					case 2:
						a = i18n.t("lang__053");
						break;
				}
				alert(a);
			} else {
				_success_modal(i18n.t("lang__079"));
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
			t = i18n.t("lang__056"); // Change Password
			m += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="currentpassword">' + i18n.t("lang__059") + '</label>';
			m += '<input type="password" name="password" id="currentpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="newpassword">' + i18n.t("lang__060") + '</label>';
			m += '<input type="password" name="newpassword" id="newpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="vnewpassword">' + i18n.t("lang__061") + '</label>';
			m += '<input type="password" name="vnewpassword" id="vnewpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label style="display:flex; align-items:center; gap:10px; cursor:pointer;">';
			m += '<input type="checkbox" name="log_all_device" id="log_all_device"> ' + i18n.t("lang__064");
			m += '</label>';
			m += '</div>';

			m += '</div>';
			break;
		case 1:
			t = i18n.t("lang__057"); // Change Username
			m += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="currentpassword">' + i18n.t("lang__059") + '</label>';
			m += '<input type="password" name="password" id="currentpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="newusername">' + i18n.t("lang__062") + '</label>';
			m += '<input type="text" name="newusername" id="newusername" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '</div>';

			// Cooldown Check
			var lastChange = window._lastUsernameChange || 0;
			var now = Math.floor(Date.now() / 1000);
			var cooldown = 90 * 86400; // 90 days
			var diff = now - lastChange;

			if (lastChange > 0 && diff < cooldown) {
				var remaining = Math.ceil((cooldown - diff) / 86400);
				m += '<div class="alert-box warning" style="margin-bottom:15px;">';
				m += '<i class="fa-solid fa-clock"></i> You can change your username again in ' + remaining + ' days.';
				m += '</div>';
				setTimeout(function () {
					gebi('newusername').disabled = true;
					gebi('btnChangeInfo').disabled = true;
					gebi('btnChangeInfo').classList.add('disabled');
				}, 100);
			}

			m += '</div>';
			break;
		case 2:
			t = i18n.t("lang__058"); // Change Email
			m += '<div class="upload-modal-body" style="display:block; padding:20px;">';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="currentpassword">' + i18n.t("lang__059") + '</label>';
			m += '<input type="password" name="password" id="currentpassword" class="index_input_box" required>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="newemail">' + i18n.t("lang__063") + '</label>';
			m += '<div style="display:flex; gap:10px;">';
			m += '<input type="email" name="newemail" id="newemail" class="index_input_box" style="flex:1;" required>';
			m += '<button class="btn-primary" id="getCode" style="white-space:nowrap;"><div class="background" id="gcb"></div>' + i18n.t("lang__067") + ' <i class="fa-light fa-envelope"></i></button>';
			m += '</div>';
			m += '<div class="required"></div>';
			m += '</div>';

			m += '<div style="margin-bottom:15px;">';
			m += '<label class="input-label" for="verifyCode">' + i18n.t("lang__069") + '</label>';
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
				r[0].innerHTML = i18n.t("lang__046");
			if (!p.hasClass('disabled')) {
				d = new FormData();
				d.append('type', 'RequestEmailCode');
				d.append('CurrentPassword', btoa(gebi('currentpassword').value));
				d.append('NewEmail', v.value);
				$.ajax(backend_url + 'Account.php', {
					method: "POST",
					data: d,
					processData: false,
					contentType: false,
					success: function (q) {
						if (q['success'] != 1) {
							switch (q['code']) {
								case 0:
									m = i18n.t("lang__054");
									i = 1;
									break;
								case 1:
									m = i18n.t("lang__055");
									i = 0;
									break;
								case 2:
									m = i18n.t("lang__050");
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
				p.prop('disabled', false);
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
				$.ajax(backend_url + 'Account.php?action=check_' + t, {
					method: "POST",
					data: d,
					processData: false,
					contentType: false,
					async: false,
					success: function (q) {
						a = false;
						if (q['code'] == 1) {
							m = (c == 1) ? i18n.t("lang__051") : i18n.t("lang__050");
						} else if (q['code'] == 2) {
							m = (c == 1) ? i18n.t("lang__052") : i18n.t("lang__054");
						} else {
							m = (c == 1) ? i18n.t("lang__065") : i18n.t("lang__066");
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

		$.ajax(backend_url + 'Account.php', {
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
function _change_picture(isCover = 0, groupId = 0) {
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "flex"; // Using flex for centering if modal css supports it, otherwise block

	// Create Clean Modal Content
	var a = '';
	a += '<div class="upload-modal-container">';

	// Header
	a += '<div class="upload-modal-header">';
	a += '<h2>' + ((isCover == 1) ? i18n.t('lang__041') : i18n.t('lang__042')) + '</h2>';
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
	a += '<button id="btnCrop" class="btn-primary" style="display:none;">' + i18n.t('lang__043') + '</button>';
	a += '<button id="btnSavePicture" class="btn-success" style="display:none;">' + i18n.t('lang__044') + '</button>';
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

							// Visual Feedback
							$('#btnCrop').css('display', 'none');
							$('#btnSavePicture').css('display', 'inline-block');
							$('#cropper_box').css('display', 'none');

							// Show preview in results
							$result.html('<div style="padding:20px; text-align:center;"><img src="' + croppedImageDataURL + '" style="max-width:100%; border-radius:8px; box-shadow: var(--shadow-md);"></div>');

							canvas.cropper('getCroppedCanvas').toBlob(function (blob) {
								$('#btnSavePicture').off('click').on('click', function () {
									var formData = new FormData();
									formData.append('fileUpload', blob, 'media_cropped.jpg');
									formData.append('type', (isCover == 1) ? 'cover' : 'profile'); // Fixed type
									if (groupId > 0) formData.append('group_id', groupId);

									// Show loading state?
									$(this).text('Saving...').prop('disabled', true);

									$.ajax(backend_url + 'Account.php', {
										method: "POST",
										data: formData,
										processData: false,
										contentType: false,
										success: function () {
											modal_close();
											// Reload specific image
											if (isCover == 1) {
												if (groupId > 0) {
													$("#group-cover").attr('src', croppedImageDataURL);
												} else {
													$("#profile_cover").css('background-image', "url('" + croppedImageDataURL + "')");
													$("#setting_profile_cover").css('background-image', "url('" + croppedImageDataURL + "')");
												}
											} else {
												if (groupId > 0) {
													$("#group-pfp").attr('src', croppedImageDataURL);
												} else {
													$("#profile_image").attr('src', croppedImageDataURL);
													$("#profile_picture").attr('src', croppedImageDataURL);
												}
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
	var itemsJson = JSON.stringify(items).replace(/"/g, '&quot;');

	if (items.length === 1) {
		// Single Item
		var s = items[0];
		if (s.format.startsWith('video')) {
			let mediaUrl = video_cdn + '&id=' + s.id + '&h=' + s.hash;
			return '<div class="post-media-container">' +
				'<div class="single-media-wrapper">' +
				'<div class="custom-video-container">' +
				'<video src="' + mediaUrl + '" preload="metadata"></video>' +
				'</div>' +
				'</div>' +
				'</div>';
		} else
			return '<div class="post-media-container">' +
				'<div class="single-media-wrapper">' +
				'<div class="media-backdrop" style="background-image: url(\'' + media_cdn + '&id=' + s.id + '&h=' + s.hash + '\')"></div>' +
				'<img src="' + media_cdn + '&id=' + s.id + '&h=' + s.hash + '" onclick="viewFullImage(' + itemsJson + ', 0)" style="cursor:pointer;">' +
				'</div>' +
				'</div>';
	} else {
		// Carousel
		var uid = Math.floor(Math.random() * 1000000);
		var h = '<div class="carousel-container" id="carousel-' + uid + '">';

		// Slides
		items.forEach(function (s, idx) {
			var active = (idx === 0) ? 'active' : '';
			var content = '';
			let mediaUrl = s.format.startsWith('video')
				? video_cdn + '&id=' + s.id + '&h=' + s.hash
				: media_cdn + '&id=' + s.id + '&h=' + s.hash;
			if (s.format.startsWith('video')) {
				content = '<div class="custom-video-container">' +
					'<video src="' + mediaUrl + '" preload="metadata"></video>' +
					'</div>';
			} else {
				content = '<div class="media-backdrop" style="background-image: url(\'' + mediaUrl + '\')"></div>';
				content += '<img src="' + mediaUrl + '" onclick="viewFullImage(' + itemsJson + ', ' + idx + ')" style="cursor:pointer;">';
			}
			h += '<div class="carousel-slide ' + active + '" data-index="' + idx + '">' + content + '</div>';
		});

		// Navigation Controls
		h += '<button class="carousel-prev" onclick="moveSlide(\'' + uid + '\', -1)">&#10094;</button>';
		h += '<button class="carousel-next" onclick="moveSlide(\'' + uid + '\', 1)">&#10095;</button>';

		// Dots or Indicator
		if (items.length > 5) {
			h += '<div class="carousel-indicator">' +
				'<span class="current-index">1</span> / <span class="total-count">' + items.length + '</span>' +
				'</div>';
		} else {
			h += '<div class="dots-container">';
			items.forEach(function (s, idx) {
				var active = (idx === 0) ? 'active' : '';
				h += '<span class="dot ' + active + '" onclick="currentSlide(\'' + uid + '\', ' + idx + ')"></span>';
			});
			h += '</div>';
		}

		h += '</div>'; // End container
		return '<div class="media-carousel-container">' + h + '</div>';
	}
}

/* --- Custom Video Player Logic --- */
function initVideoPlayer(container) {
	var video = container.querySelector('video');
	if (!video || container.dataset.playerInit === 'true') return;
	container.dataset.playerInit = 'true';
	container.classList.add('video-paused');

	// Create control elements
	var controls = document.createElement('div');
	controls.className = 'custom-video-controls';
	controls.innerHTML = `
		<button class="video-control-btn video-play-btn"><i class="fa-solid fa-play"></i></button>
		<div class="video-progress-container">
			<div class="video-buffer-bar"></div>
			<div class="video-progress-bar"></div>
		</div>
		<div class="video-time-display">0:00 / 0:00</div>
		<div class="video-volume-container">
			<button class="video-control-btn video-mute-btn"><i class="fa-solid fa-volume-high"></i></button>
			<input type="range" class="video-volume-slider" min="0" max="1" step="0.1" value="1">
		</div>
		<div class="video-speed-container">
			<button class="video-control-btn video-speed-btn">1x</button>
			<div class="video-speed-menu">
				<button class="speed-option" data-speed="0.5">0.5x</button>
				<button class="speed-option" data-speed="0.75">0.75x</button>
				<button class="speed-option active" data-speed="1">1x (Normal)</button>
				<button class="speed-option" data-speed="1.25">1.25x</button>
				<button class="speed-option" data-speed="1.5">1.5x</button>
				<button class="speed-option" data-speed="2">2x</button>
			</div>
		</div>
		<button class="video-control-btn video-fullscreen-btn"><i class="fa-solid fa-expand"></i></button>
	`;
	container.appendChild(controls);

	// Create big play button
	var bigPlay = document.createElement('div');
	bigPlay.className = 'video-big-play';
	bigPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
	container.appendChild(bigPlay);

	// Get references
	var playBtn = controls.querySelector('.video-play-btn');
	var progressContainer = controls.querySelector('.video-progress-container');
	var progressBar = controls.querySelector('.video-progress-bar');
	var bufferBar = controls.querySelector('.video-buffer-bar');
	var timeDisplay = controls.querySelector('.video-time-display');
	var muteBtn = controls.querySelector('.video-mute-btn');
	var volumeSlider = controls.querySelector('.video-volume-slider');
	var fullscreenBtn = controls.querySelector('.video-fullscreen-btn');
	var speedBtn = controls.querySelector('.video-speed-btn');
	var speedMenu = controls.querySelector('.video-speed-menu');
	var speedOptions = controls.querySelectorAll('.speed-option');

	function formatTime(seconds) {
		if (isNaN(seconds)) return '0:00';
		var mins = Math.floor(seconds / 60);
		var secs = Math.floor(seconds % 60);
		return mins + ':' + (secs < 10 ? '0' : '') + secs;
	}

	function updatePlayState() {
		if (video.paused) {
			container.classList.add('video-paused');
			playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
			bigPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
		} else {
			container.classList.remove('video-paused');
			playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
		}
	}

	function togglePlay() {
		if (video.paused) video.play();
		else video.pause();
	}

	// Event bindings
	video.addEventListener('play', updatePlayState);
	video.addEventListener('pause', updatePlayState);
	video.addEventListener('click', togglePlay);
	playBtn.addEventListener('click', togglePlay);
	bigPlay.addEventListener('click', togglePlay);

	video.addEventListener('timeupdate', function () {
		var percent = (video.currentTime / video.duration) * 100;
		progressBar.style.width = percent + '%';
		timeDisplay.innerText = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
	});

	video.addEventListener('progress', function () {
		if (video.buffered.length > 0) {
			var buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
			bufferBar.style.width = buffered + '%';
		}
	});

	progressContainer.addEventListener('click', function (e) {
		var rect = progressContainer.getBoundingClientRect();
		var pos = (e.clientX - rect.left) / rect.width;
		video.currentTime = pos * video.duration;
	});

	// Update volume slider fill
	function updateVolumeSliderFill(value) {
		var percent = value * 100;
		volumeSlider.style.background = 'linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ' + percent + '%, rgba(255, 255, 255, 0.3) ' + percent + '%, rgba(255, 255, 255, 0.3) 100%)';
	}

	// Initialize volume slider fill
	updateVolumeSliderFill(volumeSlider.value);

	muteBtn.addEventListener('click', function () {
		video.muted = !video.muted;
		muteBtn.innerHTML = video.muted
			? '<i class="fa-solid fa-volume-xmark"></i>'
			: '<i class="fa-solid fa-volume-high"></i>';
		volumeSlider.value = video.muted ? 0 : video.volume;
		updateVolumeSliderFill(volumeSlider.value);
	});

	volumeSlider.addEventListener('input', function () {
		video.volume = volumeSlider.value;
		video.muted = volumeSlider.value == 0;
		muteBtn.innerHTML = video.muted
			? '<i class="fa-solid fa-volume-xmark"></i>'
			: '<i class="fa-solid fa-volume-high"></i>';
		updateVolumeSliderFill(volumeSlider.value);
	});

	// Playback Speed Logic
	speedBtn.addEventListener('click', function (e) {
		e.stopPropagation();
		speedMenu.classList.toggle('show');
	});

	speedOptions.forEach(option => {
		option.addEventListener('click', function (e) {
			e.stopPropagation();
			var speed = parseFloat(this.dataset.speed);
			video.playbackRate = speed;
			speedBtn.innerText = speed + 'x';

			speedOptions.forEach(opt => opt.classList.remove('active'));
			this.classList.add('active');
			speedMenu.classList.remove('show');
		});
	});

	// Close speed menu when clicking elsewhere
	document.addEventListener('click', function () {
		if (speedMenu) speedMenu.classList.remove('show');
	});

	fullscreenBtn.addEventListener('click', function () {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			container.requestFullscreen();
		}
	});

	document.addEventListener('fullscreenchange', function () {
		if (document.fullscreenElement === container) {
			fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
		} else {
			fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
		}
	});

	video.addEventListener('loadedmetadata', function () {
		timeDisplay.innerText = '0:00 / ' + formatTime(video.duration);
	});
}

// Initialize all video players on page
function initAllVideoPlayers() {
	document.querySelectorAll('.custom-video-container').forEach(initVideoPlayer);
}

// MutationObserver to catch dynamically added videos
var videoObserver = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		mutation.addedNodes.forEach(function (node) {
			if (node.nodeType === 1) {
				if (node.classList && node.classList.contains('custom-video-container')) {
					initVideoPlayer(node);
				}
				node.querySelectorAll && node.querySelectorAll('.custom-video-container').forEach(initVideoPlayer);
			}
		});
	});
});
videoObserver.observe(document.body, { childList: true, subtree: true });

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
	if (!container) return;
	var slides = container.getElementsByClassName("carousel-slide");
	var dots = container.getElementsByClassName("dot");
	var indicator = container.querySelector(".carousel-indicator .current-index");

	if (n >= slides.length) { n = 0 }
	if (n < 0) { n = slides.length - 1 }

	// Auto-pause videos
	var allVideos = container.querySelectorAll('video');
	allVideos.forEach(v => v.pause());

	for (var i = 0; i < slides.length; i++) {
		slides[i].className = slides[i].className.replace(" active", "");
		if (dots.length > i) dots[i].className = dots[i].className.replace(" active", "");
	}

	slides[n].className += " active";
	if (dots.length > n) dots[n].className += " active";
	if (indicator) indicator.innerText = (n + 1);
}

/* --- Multi-Upload Preview Logic --- */
var dt = new DataTransfer(); // Holds selected files

function handleFiles(files) {
	// Merge new files into DataTransfer
	if ((dt.items.length + files.length) > 60) {
		alert("You can only upload a maximum of 60 files.");
		return;
	}

	// Count existing videos
	let videoCount = 0;
	for (let i = 0; i < dt.files.length; i++) {
		if (dt.files[i].type.startsWith('video/')) videoCount++;
	}

	for (let i = 0; i < files.length; i++) {
		if (files[i].type.startsWith('video/')) {
			if (videoCount >= 1) {
				alert("Only one video is allowed per post.");
				continue; // Skip additional videos
			}
			videoCount++;
		}
		dt.items.add(files[i]);
	}
	updatePreview();
}

/* Lightbox Logic */
var currentLightboxItems = [];
var currentLightboxIndex = 0;

function viewFullImage(items, index = 0) {
	if (typeof items === 'string') {
		currentLightboxItems = [{ id: 0, hash: '', format: 'image', url: items }];
		currentLightboxIndex = 0;
	} else {
		currentLightboxItems = items;
		currentLightboxIndex = index;
	}

	var lb = gebi('lightbox-modal');
	if (!lb) {
		lb = document.createElement('div');
		lb.id = 'lightbox-modal';
		document.body.appendChild(lb);
	}

	updateLightbox();
	lb.style.display = 'flex';
	gebtn('body')[0].style.overflow = "hidden";
}

function updateLightbox() {
	var lb = gebi('lightbox-modal');
	var s = currentLightboxItems[currentLightboxIndex];
	var url = s.url ? s.url : (media_cdn + '&id=' + s.id + '&h=' + s.hash);
	var isVideo = s.format.startsWith('video');

	var h = '';
	h += '<div class="lightbox-close" onclick="closeLightbox()"><i class="fa-solid fa-xmark"></i></div>';

	if (currentLightboxItems.length > 1) {
		h += '<button class="lightbox-nav lightbox-prev" onclick="moveLightbox(-1); event.stopPropagation();">&#10094;</button>';
		h += '<button class="lightbox-nav lightbox-next" onclick="moveLightbox(1); event.stopPropagation();">&#10095;</button>';
	}

	if (isVideo) {
		h += '<video src="' + url + '" controls autoplay style="max-width:95%; max-height:95%;"></video>';
	} else {
		h += '<img src="' + url + '" onclick="event.stopPropagation();">';
	}

	lb.innerHTML = h;
	lb.onclick = closeLightbox;
}

function moveLightbox(n) {
	currentLightboxIndex += n;
	if (currentLightboxIndex >= currentLightboxItems.length) currentLightboxIndex = 0;
	if (currentLightboxIndex < 0) currentLightboxIndex = currentLightboxItems.length - 1;
	updateLightbox();
}

function closeLightbox() {
	var lb = gebi('lightbox-modal');
	if (lb) {
		lb.style.display = 'none';
		lb.innerHTML = '';
	}
	gebtn('body')[0].style.overflow = "auto";
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
				content = '<div class="video-preview-wrapper"><video src="' + reader.result + '"></video><div class="video-preview-overlay"><i class="fa-solid fa-video"></i></div></div>';
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

function handleFiles(files) {
	for (let i = 0; i < files.length; i++) {
		if (dt.files.length >= 60) break;
		dt.items.add(files[i]);
	}
	updatePreview();
}


function make_post(groupId = 0) {
	gebtn('body')[0].style.overflowY = "hidden";
	gebi("modal").style.display = "block";

	// Clear DataTransfer on new post
	dt = new DataTransfer();

	a = "";
	a += '<div class="modal-box-container" style="max-width: 550px; margin: 0; padding: 25px;">';
	a += '<div class="share-modal-title">Create New Post</div>';

	a += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">';
	a += '<div class="modal-header-user">';
	var userPfp = "data/images/U.png";
	if (lsg('pfp_media_id') > 0) userPfp = pfp_cdn + '&id=' + lsg('pfp_media_id') + "&h=" + lsg('pfp_media_hash');
	a += '<img class="modal-user-pfp" src="' + userPfp + '">';
	a += '<div style="display:flex; flex-direction:column;">';
	a += '<span class="modal-user-name">' + gebi('fullname').value + '</span>';
	if (groupId > 0) {
		var gName = (_currentGroupData && _currentGroupData.group_id == groupId) ? _currentGroupData.group_name : "Community";
		a += '<div class="modal-context-badge"><i class="fa-solid fa-users"></i> Post to ' + gName + '</div>';
		a += '<input type="hidden" id="private" value="2">'; // Fixed public for groups (group privacy handles visibility)
	} else {
		a += '<select name="private" id="private" class="modal-privacy-select">';
		a += '<option value="2">' + i18n.t("lang__002") + '</option>';
		a += '<option value="1">' + i18n.t("lang__004") + '</option>';
		a += '<option value="0">' + i18n.t("lang__003") + '</option>';
		a += '</select>';
	}
	a += '</div>';
	a += '</div>';
	a += '</div>';

	a += '<textarea rows="4" name="caption" class="caption" placeholder="' + i18n.t("lang__094") + '" style="width:100%; border:none; background:transparent; font-size:1.2rem; resize:none; outline:none; margin-bottom:15px;"></textarea>';

	// Multi-upload preview
	a += '<div id="media-preview-container" class="media-preview-grid" style="margin-bottom:15px;"></div>';

	// Upload Progress
	a += '<div id="upload-progress-container"><div id="upload-progress-bar"></div></div>';

	a += '<div class="createpostbuttons" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:20px;">';
	a += '<div style="display:flex; gap:15px; align-items:center;">';
	a += '<label style="cursor:pointer; transition: transform 0.2s;" onmouseover="this.style.transform=\'scale(1.1)\'" onmouseout="this.style.transform=\'scale(1)\'">';
	a += '<i class="fa-regular fa-image" style="font-size:1.6rem; color:var(--color-primary);"></i>';
	a += '<input type="file" accept="image/*,video/*" name="fileUpload[]" id="imagefile" multiple style="display:none;">';
	a += '</label>';
	a += '<div id="spoiler-toggle" class="spoiler-toggle" onclick="this.classList.toggle(\'active\')" title="Mark as Spoiler" style="cursor:pointer; font-size:1.6rem; color:var(--color-text-secondary);"><i class="fa-solid fa-eye-slash"></i></div>';
	a += '</div>';
	a += '<input type="button" class="btn-primary" value="' + i18n.t("lang__001") + '" onclick="return validatePost(0)" style="padding: 10px 30px; font-size:1rem; border-radius:10px;">';
	a += '</div>';

	if (groupId > 0) {
		a += '<input type="hidden" id="post_group_id" value="' + groupId + '">';
	}

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
	// Final Safety Check
	if (typeof dt !== 'undefined' && dt.files.length > 60) {
		_alert_modal("You can only upload a maximum of 60 files.");
		return;
	}
	f = new FormData();
	f.append("post", 'post');
	f.append("private", is_private);
	f.append("caption", gebtn("textarea")[0].value);
	var spoilerToggle = gebi('spoiler-toggle');
	if (spoilerToggle) f.append("is_spoiler", spoilerToggle.classList.contains('active') ? 1 : 0);

	var gId = gebi('post_group_id');
	if (gId) f.append("group_id", gId.value);

	let videoCount = 0;
	// Append all files from DataTransfer
	for (let i = 0; i < dt.files.length; i++) {
		if (dt.files[i].type.startsWith('video/')) {
			if (videoCount >= 1) continue;
			videoCount++;
		}
		f.append("fileUpload[]", dt.files[i]);
	}

	var pContainer = gebi('upload-progress-container');
	var pBar = gebi('upload-progress-bar');
	if (pContainer) pContainer.style.display = 'block';

	$.ajax({
		type: "POST",
		url: backend_url + "Post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		xhr: function () {
			var xhr = new window.XMLHttpRequest();
			xhr.upload.addEventListener("progress", function (evt) {
				if (evt.lengthComputable && pBar) {
					var percentComplete = (evt.loaded / evt.total) * 100;
					pBar.style.width = percentComplete + '%';
				}
			}, false);
			return xhr;
		},
		success: function (r) {
			r = JSON.parse(r);
			if (r["success"] == 1) {
				var gId = gebi('post_group_id');
				if (gId) {
					fetch_post("Post.php?scope=group&id=" + gId.value, true);
				} else {
					fetch_post("Post.php?scope=feed", true);
				}
			}

			// Close modal and clear logic handled by validatePost, but redundant safety:
			if (pContainer) pContainer.style.display = 'none';
		},
		error: function () {
			if (pContainer) pContainer.style.display = 'none';
			_alert_modal("Upload failed. Please try again.");
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

	// Advanced Filters for Posts
	if (type == 1) {
		f.append("scope", gebi('search-scope').value);
		f.append("privacy", gebi('search-privacy').value);
		f.append("start_date", gebi('search-start-date').value);
		f.append("end_date", gebi('search-end-date').value);

		var commId = gebi('search-comm-id');
		if (commId) f.append("group_id", commId.value);
	}
	$.ajax({
		type: "POST",
		url: backend_url + 'User.php?action=search',
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		success: function (r) {
			b = make_blob_url(r, 'application/json');
			r = JSON.parse(r);
			a = '';
			if (r['success'] == 2) {
				search.innerHTML = '<div class="post"><div style="text-align:center; padding: 20px;">' + i18n.t("lang__084") + '</div></div>';
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
							a += ' ' + getVerifiedBadge(r[i]['verified'], "margin-left:5px;");
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
				else if (type == 4) {
					// Group Search Results
					search.className = 'groups-discovery-grid';
					for (let i = 0; i < (Object.keys(r).length - 1); i++) {
						var g = r[i];
						var coverUrl = g.cover_media_hash ? media_cdn + "&id=" + g.cover_media_id + "&h=" + g.cover_media_hash : "data/images/default_cover.png";
						var pfpUrl = g.pfp_media_hash ? media_cdn + "&id=" + g.pfp_media_id + "&h=" + g.pfp_media_hash : "data/images/default_group.png";

						a += '<a href="group.php?id=' + g.group_id + '" class="group-discovery-card" onclick="route(event, this)">';
						a += '  <div class="group-discovery-cover" style="background-image: url(' + coverUrl + ');"></div>';
						a += '  <div class="group-discovery-info">';
						a += '    <img src="' + pfpUrl + '" class="group-discovery-pfp">';
						var statusText = "";
						if (g.my_status == 1) statusText = ' <span class="group-stat-badge" style="background:var(--color-primary-alpha); color:var(--color-primary); margin-left:8px; display:inline-flex; vertical-align:middle; border-radius:12px; padding:2px 10px; font-size:0.75rem;"><i class="fa-solid fa-check"></i> Joined</span>';
						else if (g.my_status == 0) statusText = ' <span class="group-stat-badge" style="background:var(--color-surface-hover); margin-left:8px; display:inline-flex; vertical-align:middle; border-radius:12px; padding:2px 10px; font-size:0.75rem;"><i class="fa-solid fa-clock"></i> Requested</span>';

						a += '    <div class="group-discovery-name">' + g.group_name;
						if (g.verified > 0) a += ' ' + getVerifiedBadge(g.verified, "margin-left:5px;", "Verified Community");
						a += statusText + '</div>';
						a += '    <div class="group-discovery-about">' + g.group_about + '</div>';
						a += '    <div class="group-discovery-meta">';
						a += '      <span><i class="fa-solid fa-user-group"></i> ' + g.member_count + ' Members</span>';
						var privText = (g.group_privacy == 2) ? 'Public' : 'Closed';
						a += '      <span><i class="fa-solid fa-lock"></i> ' + privText + '</span>';
						a += '    </div>';
						a += '  </div>';
						a += '</a>';
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

function toggleSearchFilters() {
	var type = gebi('searchtype').value;
	var filters = gebi('advanced-filters');
	if (filters) {
		filters.style.display = (type == 1) ? 'flex' : 'none';
		if (type == 1) {
			var scope = gebi('search-scope').value;
			var commGroup = gebi('scope-community-group');
			if (commGroup) {
				commGroup.style.display = (scope == 'groups') ? 'flex' : 'none';
				if (scope == 'groups') _populate_joined_communities();
			}
		}
	}
}

function _populate_joined_communities() {
	var select = gebi('search-comm-id');
	if (!select || select.children.length > 1) return; // Already populated or missing

	$.get(backend_url + "Group.php?action=list&joined=1", function (r) {
		if (r && r.length > 0) {
			r.forEach(function (g) {
				if (g.my_status == 1) {
					var opt = document.createElement('option');
					opt.value = g.group_id;
					opt.textContent = g.group_name;
					select.appendChild(opt);
				}
			});
			initCustomSelects(true);
		}
	});
}
function _share_feed() {
	// Share feed also needs update if we allow adding images to shares? 
	// Usually share just adds caption. If user adds image it becomes a new post but referencing old?
	// Current logic: just caption. But let's check input.
	// If share allows upload, we update it too. But share usually doesn't upload new files in this app logic (from previous reading).
	// Let's stick to simple caption for share for now.

	f = new FormData();
	f.append("action", 'share');

	post_id = gebi('post_id').value;

	// Get group_id if selected
	var groupIdSelect = gebi('share_group_id');
	var groupId = groupIdSelect ? groupIdSelect.value : 0;

	// Validate: Check if sharing non-public post to group
	if (groupId > 0) {
		var postPublic = gebi('original_post_public').value;
		if (postPublic != "2") {
			_alert_modal("Only public posts can be shared to groups. Please select 'Your Timeline' or make the original post public first.");
			return;
		}
	}

	// Final Safety Check
	if (typeof dt !== 'undefined' && dt.files.length > 60) {
		_alert_modal("You can only upload a maximum of 60 files.");
		return;
	}
	// Get privacy setting
	var privacyVal = 2; // Default public
	var privacySelect = gebi('private');
	if (privacySelect) privacyVal = privacySelect.value;

	// Force Public (2) if sharing to group
	if (groupId > 0) {
		privacyVal = 2;
	}

	f = new FormData();
	f.append("post", 'post');
	f.append("private", privacyVal);
	f.append("post_id", post_id);
	f.append("caption", gebtn("textarea")[0].value);
	f.append("action", "share");

	// Add group_id if selected
	if (groupId > 0) {
		f.append("group_id", groupId);
	}

	// Append all files from DataTransfer (multi-upload support)
	if (typeof dt !== 'undefined' && dt.files.length > 0) {
		let videoCount = 0;
		for (let i = 0; i < dt.files.length; i++) {
			if (dt.files[i].type.startsWith('video/')) {
				if (videoCount >= 1) continue;
				videoCount++;
			}
			f.append("fileUpload[]", dt.files[i]);
		}
	}

	var pContainer = gebi('upload-progress-container');
	var pBar = gebi('upload-progress-bar');
	if (pContainer) pContainer.style.display = 'block';

	$.ajax({
		type: "POST",
		url: backend_url + "Post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: f,
		xhr: function () {
			var xhr = new window.XMLHttpRequest();
			xhr.upload.addEventListener("progress", function (evt) {
				if (evt.lengthComputable && pBar) {
					var percentComplete = (evt.loaded / evt.total) * 100;
					pBar.style.width = percentComplete + '%';
				}
			}, false);
			return xhr;
		},
		success: function (r) {
			if (pContainer) pContainer.style.display = 'none';

			// Parse response
			try {
				var response = JSON.parse(r);
				if (response.success == 0) {
					// Handle error
					var errorMsg = "Share failed. Please try again.";
					if (response.err === 'not_public') {
						errorMsg = response.message || "Only public posts can be shared to groups.";
					} else if (response.message) {
						errorMsg = response.message;
					}
					_alert_modal(errorMsg);
					return;
				}
			} catch (e) {
				// Legacy response format
				id = gebi('post_id').value;
				splt = r.split(";");
				zTemplate(gebi("post-share-count-" + id), {
					"counter": parseInt(splt[1])
				});
			}

			setTimeout(null, 100);
			fetch_post("Post.php?scope=feed");
		},
		error: function () {
			if (pContainer) pContainer.style.display = 'none';
			_alert_modal("Share failed. Please try again.");
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
		_alert_modal("Please enter a 6-digit code.");
		return;
	}
	$.post(backend_url + "Auth.php?action=setup_2fa", { code: code }, function (r) {
		if (r.success === 1) {
			modal_close();
			_success_modal("2FA Enabled Successfully!");
			_load_2fa_status();
		} else {
			_alert_modal("Invalid code. Please try again.");
		}
	});
}

function _disable_2fa() {
	var pass = gebi('2fa_disable_pass').value;
	var code = gebi('2fa_disable_code').value;
	if (!pass || code.length < 6) {
		_alert_modal("Please fill in all fields.");
		return;
	}
	$.post(backend_url + "Auth.php", { action: 'disable_2fa', password: pass, code: code }, function (r) {
		if (r.success === 1) {
			modal_close();
			_success_modal("2FA Disabled Successfully.");
			_load_2fa_status();
		} else {
			_alert_modal("Invalid password or 2FA code.");
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

		var u = window.location.pathname;
		if (u.includes("settings.php")) {
			_load_settings();
		}
		onResizeEvent();
		changeUrlWork();
		textAreaRework();
		initCustomSelects(); // Premium Custom Selects
	}
});

function initCustomSelects(force = false) {
	// Support various select classes
	$('.premium-select, .setting-select, .premium-select-sm, .index_input_box, .modal-privacy-select, .custom-select').each(function () {
		if (!$(this).is('select')) return; // Only target actual selects
		const $this = $(this);
		if ($this.next('.custom-select-container').length > 0) {
			if (force) $this.next('.custom-select-container').remove();
			else return; // Already initialized
		}

		const options = $this.find('option');
		const selectedOption = $this.find('option:selected');

		const container = $('<div class="custom-select-container"></div>');
		const trigger = $('<div class="custom-select-trigger"><span>' + selectedOption.text() + '</span><i class="fa-solid fa-chevron-down"></i></div>');
		const dropdown = $('<div class="custom-select-dropdown"></div>');

		options.each(function () {
			const $opt = $(this);
			const optUI = $('<div class="custom-select-option" data-value="' + $opt.val() + '">' + $opt.text() + '</div>');
			if ($opt.is(':selected')) optUI.addClass('selected');

			optUI.on('click', function (e) {
				e.stopPropagation();
				container.find('.custom-select-option').removeClass('selected');
				$(this).addClass('selected');
				trigger.find('span').text($(this).text());
				$this.val($(this).data('value')).trigger('change');
				container.removeClass('open');
			});

			dropdown.append(optUI);
		});

		trigger.on('click', function (e) {
			e.stopPropagation();
			// Close other selects
			$('.custom-select-container').not(container).removeClass('open');
			// Close post options
			$('.post-options-menu').removeClass('active');
			container.toggleClass('open');
		});

		container.append(trigger).append(dropdown);
		$this.after(container);
		$this.hide();

		// Special case for search page: hide the old manual chevron if it exists in the wrapper
		$this.siblings('.select-icon').hide();
	});
}
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
		if (this.href != '' && this.className != "post-link" && this.target != "_blank") {
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
// Enhanced fetch_post
var _feedLoading = false;
function fetch_post(loc, reset = false) {
	fetch_pfp_box();
	if (_feedLoading) return;

	var feedContainer = gebi("feed");
	var pageInput = gebi('page');

	if (!feedContainer || !pageInput) return;

	if (reset) {
		feedContainer.innerHTML = '';
		pageInput.value = 0;
	}

	// Check if we hit end
	if (pageInput.value == -1) return;

	_feedLoading = true;

	// If loc is a blob or full URL, don't prepend backend_url or append page (blob is static)
	var url = (loc.indexOf('blob:') === 0 || loc.indexOf('http') === 0) ? loc : backend_url + loc;
	if (loc.indexOf('blob:') !== 0) {
		var sep = loc.includes('?') ? '&' : '?';
		url += sep + "page=" + pageInput.value;
	}

	$.get(url, function (data) {
		_feedLoading = false;

		if (data.success == 2) {
			// End of feed
			pageInput.value = -1;
			if (reset) {
				feedContainer.innerHTML = '<div class="post"><h1>' + i18n.t("lang__012") + '</h1></div>';
			}
			return;
		}

		if (data.success == 1) {
			var html = '';
			var count = Object.keys(data).length - 1; // -1 for success key

			for (let i = 0; i < count; i++) {
				html += createPostHTML(data[i]);
			}

			feedContainer.insertAdjacentHTML('beforeend', html);

			// Post-Process: Load Videos
			for (let i = 0; i < count; i++) {
				var s = data[i];
				if (s['is_video']) {
					let v = gebi("video_pid-" + s['post_id']);
					if (v) load_video(s['post_media'], s['media_hash'], s['media_format'], v);
				}
				if (s['is_share'] > 0 && s['share']['is_video']) {
					let v = gebi("video_pid-" + s['share']['post_id'] + 's');
					if (v) load_video(s['share']['post_media'], s['share']['media_hash'], s['share']['media_format'], v);
				}
			}

			HighLightHLJS();

			// Advance Page
			pageInput.value = parseInt(pageInput.value) + 1;
		}

		changeUrlWork();
	});
}

function isBottom() {
	calc = $(window).scrollTop() * 2.15 + $(window).height() > $(document).height() - 200;
	return calc;
}

$(window).scroll(function () {
	u = window.location.pathname;

	// Check if we need to load more
	var shouldLoad = false;
	if ($(window).height() != $(document).height()) {
		if (!isMobile()) {
			if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) shouldLoad = true;
		} else {
			if (isBottom()) shouldLoad = true;
		}
	}

	if (shouldLoad) {
		// Feed / Home
		if (u === "/home.php" || u === "home.php" || u === "/") {
			fetch_post("post.php?scope=feed");
		}
		// Profile - only load posts if on Timeline tab
		else if (u.startsWith("/profile.php") || u.startsWith("profile.php")) {
			if (_activeProfileTab === 'timeline') {
				var idParam = get("id");
				var endpoint = "Post.php?scope=profile"; // Updated to use Post.php for consistency
				if (idParam) endpoint += "&id=" + idParam;
				fetch_post(endpoint);
			}
		}
		// Group - only load posts if on Timeline tab
		else if (u.includes("group.php")) {
			if (_activeGroupTab === 'timeline') {
				var groupId = get("id");
				if (groupId) {
					fetch_post("Post.php?scope=group&id=" + groupId);
				}
			}
		}
		// Others (Friends, Requests) - kept legacy as they had specific functions
		else if (u === "/friends.php" || u === "friends.php") {
			var p = gebi('page');
			if (p && p.value != -1) {
				var next = Number(p.value) + 1;
				fetch_friend_list('User.php?action=friends&page=' + next);
				p.value = next;
			}
		}
		else if (u === "/requests.php" || u === "requests.php") {
			var p = gebi('page');
			if (p && p.value != -1) {
				var next = Number(p.value) + 1;
				fetch_friend_request('fetch_friend_request.php?page=' + next);
				p.value = next;
			}
		}
	}
});

function togglePostOptions(postId) {
	const menu = gebi('post-options-menu-' + postId);
	if (!menu) return;

	// Close all other menus first
	const allMenus = document.querySelectorAll('.post-options-menu');
	allMenus.forEach(m => {
		if (m.id !== 'post-options-menu-' + postId) {
			m.classList.remove('active');
		}
	});

	menu.classList.toggle('active');
}

// Click outside to close menus
document.addEventListener('click', function (e) {
	if (!e.target.closest('.post-options-container')) {
		const allMenus = document.querySelectorAll('.post-options-menu');
		allMenus.forEach(m => m.classList.remove('active'));
	}

	// Close custom selects
	if (!e.target.closest('.custom-select-container')) {
		$('.custom-select-container').removeClass('open');
	}
});

// Initial Load
if (window.location.href.indexOf("home.php") > -1) {
	fetch_post("post.php?scope=feed", true);
}

// Settings Page Logic
function changeTab(tabName) {
	// Hide all tabs
	var tabs = document.querySelectorAll('[id^="setting-tab-"]');
	tabs.forEach(function (tab) {
		tab.style.display = 'none';
	});

	// Show selected tab
	var selectedTab = document.getElementById('setting-tab-' + tabName);
	if (selectedTab) {
		selectedTab.style.display = 'block';
	}

	// Update sidebar active state
	var links = document.querySelectorAll('.settings-sidebar a');
	links.forEach(function (link) {
		link.classList.remove('active');
	});
	var activeLink = document.getElementById('tab-' + tabName);
	if (activeLink) activeLink.classList.add('active');

	// Update URL param without reload
	var newUrl = new URL(window.location);
	newUrl.searchParams.set('tab', tabName);
	window.history.pushState({}, '', newUrl);

	// Specific logic per tab
	if (tabName === 'device') {
		_load_sessions();
	}
}

function _load_settings() {
	// Check URL for tab
	var urlParams = new URLSearchParams(window.location.search);
	var tab = urlParams.get('tab') || 'account';
	changeTab(tab);

	$.get(backend_url + "User.php?action=settings", function (d) {
		if (d.success === 1) {
			// Account Tab
			window._lastUsernameChange = d.last_username_change;
			if (gebi("display_nickname")) gebi("display_nickname").innerHTML = '@' + d.user_nickname;
			if (gebi("usernickname")) gebi("usernickname").value = d.user_nickname;

			if (gebi("display_email")) gebi("display_email").innerHTML = d.user_email;
			if (gebi("email")) gebi("email").value = d.user_email;

			// Verification
			if (gebi("verified-text")) {
				if (d.verified > 0) {
					gebi("verified-text").innerHTML = "Verified";
					gebi("verified-text").style.color = "var(--color-primary)";
					if (gebi("verified")) gebi("verified").outerHTML = getVerifiedBadge(d.verified);
				} else {
					gebi("verified-text").innerHTML = "Not Verified";
					gebi("verified-text").style.color = "var(--color-text-secondary)";
					if (gebi("verified")) gebi("verified").className = "";
				}
			}

			// 2FA Status
			if (gebi("2fa-status-text")) {
				if (d.twofa_enabled == 1) {
					gebi("2fa-status-text").innerHTML = '<span style="color:#28a745"><i class="fa-solid fa-check-circle"></i> Enabled</span>';
				} else {
					gebi("2fa-status-text").innerHTML = '<span style="color:var(--color-text-secondary)">Disabled</span>';
				}
			}

			// Profile Tab Inputs
			if (gebi("userfirstname")) gebi("userfirstname").value = d.user_firstname;
			if (gebi("userlastname")) gebi("userlastname").value = d.user_lastname;
			if (gebi("userabout")) gebi("userabout").value = d.user_about;
			if (gebi("userhometown")) gebi("userhometown").value = d.user_hometown;
			if (gebi("birthday")) gebi("birthday").value = birthdateConverter(d.user_birthdate * 1000);

			// Gender
			if (d.user_gender == 'M' && gebi("malegender")) gebi("malegender").checked = true;
			if (d.user_gender == 'F' && gebi("femalegender")) gebi("femalegender").checked = true;
			if (d.user_gender == 'O' && gebi("othergender")) gebi("othergender").checked = true;

			// Profile Images
			if (gebi("profile_picture")) {
				var pfpSrc = (d.pfp_media_id > 0) ? pfp_cdn + '&id=' + d.pfp_media_id + "&h=" + d.pfp_media_hash : getDefaultUserImage(d.user_gender);
				gebi("profile_picture").src = pfpSrc;
			}
			if (gebi("setting_profile_cover")) {
				var coverStyle = (d.cover_media_id > 0) ? 'url(\'' + pfp_cdn + '&id=' + d.cover_media_id + '&h=' + d.cover_media_hash + '\')' : 'none';
				gebi("setting_profile_cover").style.backgroundImage = coverStyle;
				if (d.cover_media_id <= 0) gebi("setting_profile_cover").style.backgroundColor = "var(--color-background)";
			}
		} else {
			// Handle logical error
			if (gebi("display_nickname")) gebi("display_nickname").innerHTML = "Error loading data.";
			_alert_modal("Failed to load settings data. Code: " + (d.success || "Unknown"));
		}
	}).fail(function () {
		// Handle network/server error
		if (gebi("display_nickname")) gebi("display_nickname").innerHTML = "Connection Error.";
		_alert_modal("Failed to connect to server to fetch settings.");
	});
}

// Session Management
function _load_sessions() {
	var container = document.getElementById('session-list');
	if (!container) return;

	container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--color-text-dim);"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading sessions...</div>';

	$.get(backend_url + "Auth.php?action=session_list", function (response) {
		if (response.success === 1) {
			var html = '';
			if (response.sessions.length === 0) {
				html = '<div class="no-data">No active sessions found.</div>';
			} else {
				response.sessions.forEach(function (s) {
					var icon = 'fa-desktop';
					if (s.device_str.toLowerCase().includes('mobile')) icon = 'fa-mobile-screen';

					var currentBadge = s.is_current ? '<span class="session-badge current">Current Device</span>' : '';
					var revokeBtn = s.is_current ? '' : '<button class="btn-danger-outline" onclick="_revoke_session(\'' + s.session_id + '\')">Log Out</button>';

					html += '<div class="session-item" id="session-' + s.session_id + '">';
					html += '  <div class="session-icon"><i class="fa-solid ' + icon + '"></i></div>';
					html += '  <div class="session-info">';
					html += '    <div class="session-title">' + s.os + ' • ' + s.browser + ' ' + currentBadge + '</div>';
					html += '    <div class="session-meta">' + s.ip + ' • ' + s.last_active + '</div>';
					html += '  </div>';
					html += '  <div class="session-action">' + revokeBtn + '</div>';
					html += '</div>';
				});
			}
			container.innerHTML = html;
		} else {
			container.innerHTML = '<div class="error-message">Failed to load sessions.</div>';
		}
	});
}

function _revoke_session(sessionId, confirmed = false) {
	if (!confirmed) {
		_confirm_modal("Are you sure you want to log out this device?", "_revoke_session('" + sessionId + "', true)");
		return;
	}

	$.post(backend_url + "Auth.php", { action: 'revoke_session', session_id: sessionId }, function (response) {
		if (response.success === 1) {
			var el = document.getElementById('session-' + sessionId);
			if (el) el.remove();
		} else {
			_alert_modal("Failed to revoke session: " + (response.error || "Unknown error"));
		}
	});
}

// Custom Modals
function _alert_modal(msg) {
	var content = gebi("modal_content");
	var h = '';
	h += '<div class="upload-modal-container" style="max-width:400px; text-align:center;">';
	h += '<div class="upload-modal-header" style="justify-content:center;"><h2>Alert</h2></div>';
	h += '<div class="upload-modal-body" style="padding:20px;">' + msg + '</div>';
	h += '<div class="upload-modal-footer" style="justify-content:center;">';
	h += '<button class="btn-primary" onclick="modal_close()">OK</button>';
	h += '</div></div>';
	content.innerHTML = h;
	gebi("modal").style.display = "flex";
}

function _toggleRelationshipPartner(val) {
	var partnerContainer = gebi('partner_selector_container');
	if (['L', 'E', 'M'].indexOf(val) !== -1) {
		partnerContainer.style.display = 'block';
		_loadFriendListForRelationship();
	} else {
		partnerContainer.style.display = 'none';
		gebi('relationship_user_id').value = 0;
	}
}

function _loadFriendListForRelationship(currentPartnerId = 0) {
	var select = gebi('relationship_user_id');
	$.get(backend_url + "User.php?action=friends", function (data) {
		if (data.success === 1) {
			var h = '<option value="0">None</option>';
			var count = Object.keys(data).length - 1;
			for (let i = 0; i < count; i++) {
				var f = data[i];
				h += '<option value="' + f.user_id + '" ' + (f.user_id == currentPartnerId ? 'selected' : '') + '>' + f.user_firstname + ' ' + f.user_lastname + '</option>';
			}
			select.innerHTML = h;
		}
	});
}
