/**
 * Admin Dashboard Logic
 * Vanilla JS implementation
 */

const Dashboard = {
    state: {
        activeTab: 'overview',
        statsInterval: null,
        searchTimeout: null,
        isLoading: false,
        currentReportStatus: 0,
        ws: null,
        enc: new TextEncoder(),
        dec: new TextDecoder()
    },

    // --- Binary Protocol Helpers ---
    packBinary(data) {
        if (data.type === 'login') {
            const token = this.state.enc.encode(data.token);
            const buf = new Uint8Array(1 + token.length);
            buf[0] = 0x03;
            buf.set(token, 1);
            return buf.buffer;
        }
        if (data.type === 'broadcast') {
            const payload = this.state.enc.encode(data.payload);
            const buf = new Uint8Array(1 + payload.length);
            buf[0] = 0x08;
            buf.set(payload, 1);
            return buf.buffer;
        }
        return null;
    },

    unpackBinary(buf) {
        const view = new DataView(buf);
        const type = view.getUint8(0);
        const uint8 = new Uint8Array(buf);

        switch (type) {
            case 0x03: { // Login Success
                const json = this.state.dec.decode(uint8.subarray(1));
                const data = JSON.parse(json);
                return { type: 'login_success', username: data.u };
            }
            case 0x05: { // Error
                const message = this.state.dec.decode(uint8.subarray(1));
                return { type: 'error', message };
            }
        }
        return null;
    },

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupGlobalListeners();

        // Initial Load
        this.switchTab('overview'); // Load default

        // Init Custom Selects
        if (window.initCustomSelects) {
            window.initCustomSelects();
        }

        // Start Polling Stats
        this.fetchStats();
        this.state.statsInterval = setInterval(() => this.fetchStats(), 5000);
    },

    // --- Navigation ---
    setupNavigation() {
        // Sidebar links
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.tab;
                this.switchTab(targetId);
            });
        });

        // Mobile Sidebar Toggle (Optional Future Proofing)
    },

    switchTab(tabId) {
        this.state.activeTab = tabId;

        // Update Sidebar
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Update Content
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');

        // Update Header
        const titles = {
            'overview': { title: 'Overview', desc: 'System monitoring and real-time management.' },
            'users': { title: 'User Directory', desc: 'Manage community members and verification.' },
            'groups': { title: 'Group Management', desc: 'Moderate and manage community hubs.' },
            'reports': { title: 'Report Center', desc: 'Review and process community feedback.' },
            'broadcast': { title: 'System Broadcast', desc: 'Send real-time alerts to the global community.' }
        };

        if (titles[tabId]) {
            document.getElementById('page-title').textContent = titles[tabId].title;
            document.getElementById('page-desc').textContent = titles[tabId].desc;
        }

        // Load Data specific to tab
        if (tabId === 'users') this.searchUsers('');
        if (tabId === 'groups') this.searchGroups('');
        if (tabId === 'reports') this.fetchReports(this.state.currentReportStatus);
        if (tabId === 'broadcast') this.setupBroadcast();
    },

    switchReportTab(status) {
        this.state.currentReportStatus = status;

        // Update tab UI
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.classList.remove('active');
            if (parseInt(tab.dataset.status) === status) {
                tab.classList.add('active');
            }
        });

        // Fetch reports with new status
        this.fetchReports(status);
    },

    // --- Data Fetching ---
    async fetchStats() {
        try {
            const req = await fetch('../../worker/Admin.php?action=stats');
            const res = await req.json();

            if (res.success) {
                this.updateStatsUI(res.stats);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    },

    updateStatsUI(stats) {
        // Disk
        document.getElementById('stat-disk-used').innerText = `${this.formatBytes(stats.disk_used)} / ${this.formatBytes(stats.disk_total)}`;
        document.getElementById('bar-disk').style.width = `${stats.disk_percent}%`;

        // RAM
        if (stats.ram_usage_percent) {
            document.getElementById('stat-ram-usage').innerText = `${this.formatBytes(stats.ram_used)} / ${this.formatBytes(stats.ram_total)} (${stats.ram_usage_percent}%)`;
            document.getElementById('bar-ram').style.width = `${stats.ram_usage_percent}%`;
        }

        // Load & Queries
        const load = stats.server_load || '0%';
        document.getElementById('stat-load').innerText = load;
        const loadPercent = parseFloat(load) || 0;
        document.getElementById('bar-load').style.width = `${loadPercent}%`;

        // Total Counts
        document.getElementById('stat-users').innerText = parseInt(stats.total_users).toLocaleString();
        document.getElementById('stat-groups').innerText = parseInt(stats.total_groups).toLocaleString();
        document.getElementById('stat-posts').innerText = parseInt(stats.total_posts).toLocaleString();
        document.getElementById('stat-comments').innerText = parseInt(stats.total_comments).toLocaleString();

        // Server Specs
        if (stats.cpu_model) document.getElementById('spec-cpu').innerText = stats.cpu_model;
        if (stats.php_version) document.getElementById('spec-php').innerText = stats.php_version;
        if (stats.mysql_version) document.getElementById('spec-mysql').innerText = stats.mysql_version;
        if (stats.darknight_version) document.getElementById('spec-dn').innerText = stats.darknight_version;
    },

    async searchUsers(query) {
        const listContainer = document.getElementById('users-list');
        listContainer.innerHTML = '<div class="list-placeholder">Loading...</div>';

        try {
            const req = await fetch('../../worker/Admin.php?action=search_users&query=' + encodeURIComponent(query));
            const res = await req.json();

            if (res.success && res.users.length > 0) {
                listContainer.innerHTML = res.users.map(u => this.renderUserItem(u)).join('');
            } else {
                listContainer.innerHTML = '<div class="list-placeholder">No users found.</div>';
            }
        } catch (e) {
            listContainer.innerHTML = '<div class="list-placeholder error">Error loading data.</div>';
        }
    },

    renderUserItem(u) {
        const isBanned = parseInt(u.is_banned) === 1;

        let pfp = `../../data/images.php?t=default_${u.user_gender === 'F' ? 'F' : (u.user_gender === 'M' ? 'M' : 'U')}`;
        if (u.pfp_media_hash) {
            pfp = `../../data/images.php?t=profile&id=${u.pfp_media_id}&h=${u.pfp_media_hash}`;
        }

        const badgeClass = isBanned ? 'badge-banned' : 'badge-verified';
        const badgeText = isBanned ? 'BANNED' : (parseInt(u.verified) > 0 ? `Level ${u.verified}` : 'User');

        return `
            <div class="list-item ${isBanned ? 'banned' : ''}">
                <img src="${pfp}" class="item-avatar">
                <div class="item-info">
                    <span class="item-name">
                        ${u.user_firstname} ${u.user_lastname} 
                        <span class="item-badge ${badgeClass}">${badgeText}</span>
                    </span>
                    <span class="item-sub">@${u.user_nickname} • ID: ${u.user_id}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="Dashboard.openVerifyModal(${u.user_id}, '${u.user_firstname}', ${u.verified})">
                        <i class="fa-solid fa-shield-halved"></i> Verify
                    </button>
                    ${isBanned
                ? `<button class="btn btn-secondary btn-sm" onclick="Dashboard.confirmAction('unban_user', ${u.user_id}, 'Unban User', 'Unban ${u.user_nickname}?')">Unban</button>`
                : `<button class="btn btn-danger btn-sm" onclick="Dashboard.confirmAction('ban_user', ${u.user_id}, 'Ban User', 'Ban ${u.user_nickname}?')">Ban</button>`
            }
                </div>
            </div>
        `;
    },

    async searchGroups(query) {
        const listContainer = document.getElementById('groups-list');
        listContainer.innerHTML = '<div class="list-placeholder">Loading...</div>';

        try {
            const req = await fetch('../../worker/Admin.php?action=search_groups&query=' + encodeURIComponent(query));
            const res = await req.json();

            if (res.success && res.groups.length > 0) {
                listContainer.innerHTML = res.groups.map(g => this.renderGroupItem(g)).join('');
            } else {
                listContainer.innerHTML = '<div class="list-placeholder">No groups found.</div>';
            }
        } catch (e) {
            listContainer.innerHTML = '<div class="list-placeholder error">Error loading data.</div>';
        }
    },

    renderGroupItem(g) {
        const isBanned = parseInt(g.is_banned) === 1;
        let pfp = g.pfp_media_hash ? `../../data/images.php?t=profile&id=${g.pfp_media_id}&h=${g.pfp_media_hash}` : `../../data/images/default_group.png`;

        return `
             <div class="list-item ${isBanned ? 'banned' : ''}">
                <img src="${pfp}" class="item-avatar" style="border-radius:12px">
                <div class="item-info">
                    <span class="item-name">${g.group_name}</span>
                    <span class="item-sub">Members: ${g.member_count || 'N/A'} • ID: ${g.group_id}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="Dashboard.openGroupModal(${g.group_id})">
                        <i class="fa-solid fa-circle-info"></i> Info
                    </button>
                    ${parseInt(g.verified) === 1
                ? `<button class="btn btn-secondary btn-sm" onclick="Dashboard.toggleGroupVerification(${g.group_id}, 0, '${g.group_name}')"><i class="fa-solid fa-certificate"></i> Unverify</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="Dashboard.toggleGroupVerification(${g.group_id}, 1, '${g.group_name}')"><i class="fa-solid fa-certificate"></i> Verify</button>`
            }
                    ${isBanned
                ? `<button class="btn btn-secondary btn-sm" onclick="Dashboard.confirmAction('unban_group', ${g.group_id}, 'Unban Group', 'Unban ${g.group_name}?')">Unban</button>`
                : `<button class="btn btn-danger btn-sm" onclick="Dashboard.confirmAction('ban_group', ${g.group_id}, 'Ban Group', 'Ban ${g.group_name}?')">Ban</button>`
            }
                </div>
            </div>
        `;
    },

    toggleGroupVerification(id, status, name) {
        const actionText = status === 1 ? 'Verify' : 'Unverify';
        this.confirmAction(
            'verify_group',
            id,
            `${actionText} Group`,
            `Are you sure you want to ${actionText.toLowerCase()} group <strong>${name}</strong>?`,
            { status: status }
        );
    },

    async openGroupModal(groupId) {
        const modal = document.getElementById('modal-group-info');
        // Reset/Loading
        document.getElementById('g-info-name').innerText = 'Loading...';
        document.getElementById('g-info-img').src = '../../data/images/default_group.png';
        modal.classList.add('active');

        try {
            const req = await fetch(`../../worker/Admin.php?action=get_group_info&id=${groupId}`);
            const res = await req.json();

            if (res.success) {
                const g = res.group;
                document.getElementById('g-info-name').innerText = g.group_name;
                document.getElementById('g-info-desc').innerText = g.group_about || 'No description';
                document.getElementById('g-info-creator').innerText = g.creator_name;
                document.getElementById('g-info-members').innerText = g.member_count;
                document.getElementById('g-info-meta').innerText = `Created on ${new Date(g.created_time * 1000).toLocaleDateString()}`;

                // Privacy
                const privacies = ['Secret', 'Closed', 'Public'];
                document.getElementById('g-info-privacy').innerText = privacies[g.group_privacy] || 'Unknown';

                // Status
                const isBanned = parseInt(g.is_banned) === 1;
                const statusSpan = document.getElementById('g-info-status');
                statusSpan.innerText = isBanned ? 'Banned' : (parseInt(g.verified) ? 'Verified' : 'Active');
                statusSpan.style.color = isBanned ? 'var(--color-danger)' : (parseInt(g.verified) ? 'var(--color-secondary)' : 'var(--color-success)');

                // Avatar
                if (g.pfp_media_hash) {
                    document.getElementById('g-info-img').src = `../../data/images.php?t=profile&id=${g.pfp_media_id}&h=${g.pfp_media_hash}`;
                } else {
                    document.getElementById('g-info-img').src = '../../data/images/default_group.png';
                }
            } else {
                alert("Failed to load group details.");
                modal.classList.remove('active');
            }
        } catch (e) {
            console.error(e);
            alert("Error fetching group data.");
            modal.classList.remove('active');
        }
    },

    async fetchReports(status = 0) {
        const listContainer = document.getElementById('reports-list');
        listContainer.innerHTML = '<div class="list-placeholder">Fetching reports...</div>';

        try {
            const req = await fetch(`../../worker/Admin.php?action=reports&status=${status}`);
            const res = await req.json();

            // Update status counts in UI if we have the elements
            if (res.pending_count !== undefined) {
                const pendingBadge = document.getElementById('pending-count-badge');
                if (pendingBadge) pendingBadge.textContent = res.pending_count;
            }

            if (res.success && res.reports.length > 0) {
                listContainer.innerHTML = res.reports.map(r => {
                    // Reporter avatar
                    let reporterPfp = `../../data/images.php?t=default_${r.reporter_gender === 'F' ? 'F' : (r.reporter_gender === 'M' ? 'M' : 'U')}`;
                    if (r.reporter_pfp_hash) {
                        reporterPfp = `../../data/images.php?t=profile&id=${r.reporter_pfp_id}&h=${r.reporter_pfp_hash}`;
                    }

                    // Type icon
                    const typeIcons = {
                        'user': 'fa-user',
                        'group': 'fa-users',
                        'post': 'fa-file-lines',
                        'comment': 'fa-comment'
                    };
                    const typeIcon = typeIcons[r.target_type] || 'fa-flag';

                    // Formatted time
                    const reportTime = new Date(r.created_time * 1000).toLocaleString();
                    const timeAgo = this.timeAgo(r.created_time * 1000);

                    // Truncate reason
                    const reasonPreview = r.reason.length > 60 ? r.reason.substring(0, 60) + '...' : r.reason;

                    return `
                        <div class="list-item report-item">
                            <img src="${reporterPfp}" class="item-avatar" title="Reporter: ${r.reporter_firstname} ${r.reporter_lastname}">
                            <div class="item-info">
                                <span class="item-name">
                                    <i class="fa-solid ${typeIcon}" style="margin-right:6px; color:var(--color-secondary);"></i>
                                    Report #${r.report_id} • ${r.target_type.charAt(0).toUpperCase() + r.target_type.slice(1)}
                                </span>
                                <span class="item-sub">
                                    By <strong>@${r.reporter_name}</strong> • ${timeAgo}
                                </span>
                                <span class="item-sub" style="margin-top:4px; color:var(--color-text-dim);">"${reasonPreview}"</span>
                            </div>
                            <div class="item-actions">
                                 <button class="btn btn-info btn-sm" onclick="Dashboard.openReportDetails(${r.report_id})">
                                    <i class="fa-solid fa-eye"></i> View
                                 </button>
                                 <button class="btn btn-primary btn-sm" onclick="Dashboard.resolveReport(${r.report_id}, 1)">
                                    <i class="fa-solid fa-check"></i> Resolve
                                 </button>
                                 <button class="btn btn-secondary btn-sm" onclick="Dashboard.resolveReport(${r.report_id}, 2)">
                                    <i class="fa-solid fa-xmark"></i> Ignore
                                 </button>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                listContainer.innerHTML = '<div class="list-placeholder"><i class="fa-regular fa-circle-check" style="margin-right:8px;"></i> No pending reports.</div>';
            }
        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<div class="list-placeholder error">Error loading reports.</div>';
        }
    },

    async openReportDetails(reportId) {
        const modal = document.getElementById('modal-report-details');
        const body = document.getElementById('report-detail-body');
        body.innerHTML = '<div class="list-placeholder">Fetching details...</div>';
        modal.classList.add('active');

        try {
            const req = await fetch(`../../worker/Admin.php?action=get_report_details&id=${reportId}`);
            const res = await req.json();

            if (res.success) {
                const det = res.details;
                const d = det.data;
                const reporter = det.reporter;

                // Reporter avatar
                let reporterPfp = `../../data/images.php?t=default_${reporter.gender === 'F' ? 'F' : (reporter.gender === 'M' ? 'M' : 'U')}`;
                if (reporter.pfp_media_hash) {
                    reporterPfp = `../../data/images.php?t=profile&id=${reporter.pfp_media_id}&h=${reporter.pfp_media_hash}`;
                }

                const reportTime = new Date(det.created_time * 1000).toLocaleString();

                let html = '';

                // Reporter Section
                html += `<div class="report-section">
                    <h4 style="margin:0 0 12px; color:var(--color-text-dim); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.5px;">Reporter</h4>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                        <img src="${reporterPfp}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
                        <div>
                            <div style="font-weight:600;">${reporter.name}</div>
                            <div style="color:var(--color-text-dim); font-size:0.9rem;">@${reporter.nickname}</div>
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; margin-bottom:16px;">
                        <div style="color:var(--color-text-dim); font-size:0.85rem; margin-bottom:4px;">Reason</div>
                        <div style="white-space:pre-wrap;word-wrap: break-word;">${det.reason}</div>
                    </div>
                    <div style="font-size:0.85rem; color:var(--color-text-dim);">
                        <i class="fa-regular fa-clock" style="margin-right:6px;"></i> Reported on ${reportTime}
                    </div>
                </div>`;

                // Reported Content Section
                html += `<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:20px 0;">`;
                html += `<div class="report-section">
                    <h4 style="margin:0 0 12px; color:var(--color-text-dim); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.5px;">Reported ${det.type}</h4>`;

                if (det.type === 'user' && d) {
                    const userPfp = d.pfp_hash ? `../../data/images.php?t=profile&id=${d.pfp_media_id}&h=${d.pfp_hash}` : `../../data/images.php?t=default_U`;
                    const isBanned = parseInt(d.is_banned) === 1;
                    html += `
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${userPfp}" style="width:56px; height:56px; border-radius:50%; object-fit:cover; border:2px solid ${isBanned ? 'var(--color-danger)' : 'var(--color-secondary)'};">
                            <div>
                                <div style="font-weight:600;">${d.user_firstname} ${d.user_lastname} ${isBanned ? '<span style="color:var(--color-danger);">(BANNED)</span>' : ''}</div>
                                <div style="color:var(--color-text-dim);">@${d.user_nickname} • ID: ${d.user_id}</div>
                            </div>
                        </div>
                        <div style="margin-top:16px; display:flex; gap:8px;">
                            ${!isBanned ? `<button class="btn btn-danger btn-sm" onclick="Dashboard.confirmAction('ban_user', ${d.user_id}, 'Ban User', 'Ban @${d.user_nickname}?'); document.getElementById('modal-report-details').classList.remove('active');"><i class="fa-solid fa-ban"></i> Ban User</button>` : `<button class="btn btn-secondary btn-sm" onclick="Dashboard.confirmAction('unban_user', ${d.user_id}, 'Unban User', 'Unban @${d.user_nickname}?'); document.getElementById('modal-report-details').classList.remove('active');"><i class="fa-solid fa-unlock"></i> Unban</button>`}
                            <a href="../../profile.php?id=${d.user_id}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-external-link"></i> View Profile</a>
                        </div>
                    `;
                } else if (det.type === 'group' && d) {
                    const groupPfp = d.pfp_hash ? `../../data/images.php?t=profile&id=${d.pfp_media_id}&h=${d.pfp_hash}` : `../../data/images/default_group.png`;
                    const isBanned = parseInt(d.is_banned) === 1;
                    html += `
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${groupPfp}" style="width:56px; height:56px; border-radius:12px; object-fit:cover;">
                            <div>
                                <div style="font-weight:600;">${d.group_name} ${isBanned ? '<span style="color:var(--color-danger);">(BANNED)</span>' : ''}</div>
                                <div style="color:var(--color-text-dim);">ID: ${d.group_id}</div>
                                <div style="color:var(--color-text-dim); margin-top:4px; font-size:0.9rem;">${d.group_about || 'No description'}</div>
                            </div>
                        </div>
                        <div style="margin-top:16px; display:flex; gap:8px;">
                            ${!isBanned ? `<button class="btn btn-danger btn-sm" onclick="Dashboard.confirmAction('ban_group', ${d.group_id}, 'Ban Group', 'Ban ${d.group_name}?'); document.getElementById('modal-report-details').classList.remove('active');"><i class="fa-solid fa-ban"></i> Ban Group</button>` : `<button class="btn btn-secondary btn-sm" onclick="Dashboard.confirmAction('unban_group', ${d.group_id}, 'Unban Group', 'Unban ${d.group_name}?'); document.getElementById('modal-report-details').classList.remove('active');"><i class="fa-solid fa-unlock"></i> Unban</button>`}
                            <a href="../../group.php?id=${d.group_id}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-external-link"></i> View Group</a>
                        </div>
                    `;
                } else if (det.type === 'post' && d) {
                    const postTime = new Date(d.post_time * 1000).toLocaleString();
                    html += `
                        <div class="detail-item"><strong>Author:</strong> ${d.user_firstname} ${d.user_lastname} (@${d.user_nickname})</div>
                        <div class="detail-item"><strong>Posted:</strong> ${postTime}</div>
                        <div class="detail-item"><strong>Caption:</strong></div>
                        <div class="detail-text-block" style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; margin-top:8px; max-height:150px; overflow-y:auto;">${d.post_caption || '<i>No caption</i>'}</div>
                        <div style="margin-top:16px; display:flex; gap:8px;">
                            <a href="../../post.php?id=${d.post_id}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-external-link"></i> View Post</a>
                        </div>
                    `;
                } else if (det.type === 'comment' && d) {
                    const commentTime = new Date(d.comment_time * 1000).toLocaleString();
                    html += `
                        <div class="detail-item"><strong>Author:</strong> ${d.user_firstname} ${d.user_lastname} (@${d.user_nickname})</div>
                        <div class="detail-item"><strong>Commented:</strong> ${commentTime}</div>
                        <div class="detail-item"><strong>Comment:</strong></div>
                        <div class="detail-text-block" style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; margin-top:8px;">${d.comment}</div>
                        <div style="margin-top:16px; display:flex; gap:8px;">
                            <a href="../../post.php?id=${d.post_id}" target="_blank" class="btn btn-secondary btn-sm"><i class="fa-solid fa-external-link"></i> View Post</a>
                        </div>
                    `;
                } else {
                    html += `<div style="color:var(--color-text-dim);">Content not found or has been deleted.</div>`;
                }

                html += '</div>';
                body.innerHTML = html;
            } else {
                body.innerHTML = `<div class="list-placeholder error">${res.message || 'Error fetching details.'}</div>`;
            }
        } catch (e) {
            console.error(e);
            body.innerHTML = '<div class="list-placeholder error">Error connecting to server.</div>';
        }
    },

    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        const intervals = [
            { label: 'y', seconds: 31536000 },
            { label: 'mo', seconds: 2592000 },
            { label: 'd', seconds: 86400 },
            { label: 'h', seconds: 3600 },
            { label: 'm', seconds: 60 }
        ];
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) return `${count}${interval.label} ago`;
        }
        return 'just now';
    },

    async resolveReport(id, status) {
        const formData = new FormData();
        formData.append('action', 'resolve_report');
        formData.append('report_id', id);
        formData.append('status', status);

        const req = await fetch('../../worker/Admin.php', { method: 'POST', body: formData });
        const res = await req.json();
        if (res.success) this.fetchReports();
    },

    // --- Modal System ---
    setupModals() {
        // Close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.close;
                document.getElementById(target).classList.remove('active');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        });
    },

    openVerifyModal(userId, name, currentLevel) {
        this.currentActionTargetId = userId;
        document.getElementById('verify-target-name').innerText = name;

        const select = document.getElementById('verify-level-select');
        select.value = currentLevel;

        // Trigger generic change event to update custom select UI if needed
        select.dispatchEvent(new Event('change'));

        // Re-init custom Select logic if needed to update UI text for value
        // Note: The custom-select.js Rewrite handles native select update automatically if triggered, 
        // we might need to manually update the trigger text if the library doesn't observe value changes.
        // For now, let's assume we might need to refresh the custom select instance or simply rely on user re-selecting.

        document.getElementById('modal-verify').classList.add('active');

        // Setup Confirm
        const confirmBtn = document.getElementById('confirm-verify');
        confirmBtn.onclick = () => {
            this.submitVerification(userId, select.value);
        };
    },

    async submitVerification(userId, level) {
        const formData = new FormData();
        formData.append('action', 'verify_user');
        formData.append('target_id', userId);
        formData.append('level', level);

        const req = await fetch('../../worker/Admin.php', { method: 'POST', body: formData });
        const res = await req.json();

        if (res.success) {
            document.getElementById('modal-verify').classList.remove('active');
            this.searchUsers(document.getElementById('user-search').value);
        } else {
            alert('Failed to update verification.');
        }
    },

    confirmAction(action, id, title, message, params = {}) {
        document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-message').innerHTML = message; // Use innerHTML for bold tags
        document.getElementById('modal-confirm').classList.add('active');

        document.getElementById('confirm-action-btn').onclick = async () => {
            const formData = new FormData();
            formData.append('action', action);
            formData.append('target_id', id);

            // Append extra params
            for (const key in params) {
                formData.append(key, params[key]);
            }

            const req = await fetch('../../worker/Admin.php', { method: 'POST', body: formData });
            const res = await req.json();

            if (res.success) {
                document.getElementById('modal-confirm').classList.remove('active');
                // Refresh current view
                if (action.includes('user')) this.searchUsers(document.getElementById('user-search').value);
                if (action.includes('group')) this.searchGroups(document.getElementById('group-search').value);
            } else {
                alert('Action failed');
            }
        };
    },

    // --- Helpers ---
    setupGlobalListeners() {
        // Search Debounce
        this.setupDebounce('user-search', (q) => this.searchUsers(q));
        this.setupDebounce('group-search', (q) => this.searchGroups(q));

        // Refresh Buttons
        document.getElementById('refresh-users').addEventListener('click', () => this.searchUsers(document.getElementById('user-search').value));
        document.getElementById('refresh-groups').addEventListener('click', () => this.searchGroups(document.getElementById('group-search').value));
        document.getElementById('refresh-reports').addEventListener('click', () => this.fetchReports());
    },

    setupDebounce(id, callback) {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener('input', (e) => {
            clearTimeout(this.state.searchTimeout);
            this.state.searchTimeout = setTimeout(() => {
                callback(e.target.value);
            }, 400);
        });
    },

    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    },

    // --- Broadcast System ---
    setupBroadcast() {
        if (this.state.ws) return; // Already setup

        const statusEl = document.getElementById('ws-status');
        const sendBtn = document.getElementById('btn-send-broadcast');
        const textArea = document.getElementById('broadcast-msg');

        this.state.ws = new WebSocket('ws://' + window.location.hostname + ':8080');
        this.state.ws.binaryType = 'arraybuffer';

        this.state.ws.onopen = () => {
            statusEl.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 0.6rem; margin-right: 5px; color: var(--color-success);"></i> Connected to Broadcast Service';

            // Login as Admin using token
            const token = this.getCookie('access_token');
            if (token) {
                const bin = this.packBinary({
                    type: 'login',
                    token: token
                });
                if (bin) this.state.ws.send(bin);
            }
        };

        this.state.ws.onmessage = (event) => {
            let data = null;
            if (typeof event.data === 'string') {
                // If it looks like a binary packet (starts with non-printable opcode)
                if (event.data.length > 0 && event.data.charCodeAt(0) < 32) {
                    try {
                        const buf = new Uint8Array(event.data.length);
                        for (let i = 0; i < event.data.length; i++) buf[i] = event.data.charCodeAt(i);
                        data = this.unpackBinary(buf.buffer);
                    } catch (e) {
                        console.error("Failed to unpack binary-in-text:", e);
                    }
                }

                if (!data) {
                    try {
                        data = JSON.parse(event.data);
                    } catch (e) {
                        console.error("JSON Parse Error:", e, "Payload:", event.data);
                    }
                }
            } else {
                data = this.unpackBinary(event.data);
            }

            if (!data) return;

            if (data.type === 'login_success') {
                sendBtn.disabled = false;
            } else if (data.type === 'error') {
                console.error("WS Error:", data.message);
                this.showModal("Broadcast Service Error", data.message);
            }
        };

        this.state.ws.onclose = () => {
            statusEl.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 0.6rem; margin-right: 5px; color: var(--color-danger);"></i> Disconnected from Broadcast Service';
            sendBtn.disabled = true;
            this.state.ws = null;
            // Retry after 5s if still on broadcast tab
            setTimeout(() => {
                if (this.state.activeTab === 'broadcast') this.setupBroadcast();
            }, 5000);
        };

        sendBtn.onclick = () => {
            const msg = textArea.value.trim();
            if (!msg) return;

            this.showConfirm("Confirm Broadcast", "Are you sure you want to broadcast this message to ALL users?", () => {
                const bin = this.packBinary({
                    type: 'broadcast',
                    payload: msg
                });
                if (bin) this.state.ws.send(bin);
                textArea.value = '';
            });
        };
    },

    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    showModal(title, message) {
        const modal = document.getElementById('modal-broadcast-confirm');
        document.getElementById('modal-broadcast-title').textContent = title;
        document.getElementById('modal-broadcast-message').textContent = message;
        document.getElementById('modal-broadcast-ok').style.display = 'none';
        document.querySelector('#modal-broadcast-footer [data-close]').textContent = 'OK';
        modal.classList.add('active');
    },

    showConfirm(title, message, onConfirm) {
        const modal = document.getElementById('modal-broadcast-confirm');
        const okBtn = document.getElementById('modal-broadcast-ok');
        const cancelBtn = document.querySelector('#modal-broadcast-footer [data-close]');

        document.getElementById('modal-broadcast-title').textContent = title;
        document.getElementById('modal-broadcast-message').textContent = message;
        okBtn.style.display = 'inline-block';
        cancelBtn.textContent = 'Cancel';

        // Store callback and use a single handler
        this._confirmCallback = onConfirm;

        okBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.remove('active');
            if (this._confirmCallback) {
                this._confirmCallback();
                this._confirmCallback = null;
            }
        };

        modal.classList.add('active');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});